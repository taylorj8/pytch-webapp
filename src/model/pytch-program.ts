import { AssetNameAndType } from "../database/indexed-db";
import { assertNever, hexSHA256 } from "../utils";
import {
  AssetMetaData,
  FlattenResults,
  flattenProgram,
} from "./junior/structured-program";
import {
  StructuredProgram,
  StructuredProgramOps,
} from "./junior/structured-program/program";

// To regenerate the JavaScript after updating the schema file
// "pytch-program-schema.json", be in the same directory as
// this file, then run:
//
//   ./refresh-pytch-program-json-validation.sh
//
import { validate as _untypedValidate } from "./pytch-program-json-validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validatePytchProgramJson = _untypedValidate as any;

export type PytchProgram =
  | { kind: "flat"; text: string }
  | { kind: "per-method"; program: StructuredProgram };

export type PytchProgramKind = PytchProgram["kind"];

export const PytchProgramAllKinds: Array<PytchProgramKind> = [
  "flat",
  "per-method",
];

export type PytchProgramOfKind<KindT extends PytchProgram["kind"]> =
  PytchProgram & { kind: KindT };

export class PytchProgramOps {
  /** Return a new `PytchProgram` instance of kind `"flat"` and with the
   * given `text`. */
  static fromPythonCode(text: string): PytchProgram {
    return { kind: "flat", text };
  }

  static newEmpty(kind: "flat"): PytchProgramOfKind<"flat">;
  static newEmpty(kind: "per-method"): PytchProgramOfKind<"per-method">;
  static newEmpty(kind: PytchProgramKind) {
    switch (kind) {
      case "flat":
        // TODO: Extract this to a constant somewhere.
        return { kind, text: "import pytch\n\n" };
      case "per-method":
        return { kind, program: StructuredProgramOps.newEmpty() };
      default:
        return assertNever(kind);
    }
  }

  /** Return a new `PytchProgram` instance of kind `"per-method"` and
   * with the given structured `program`. */
  static fromStructuredProgram(program: StructuredProgram): PytchProgram {
    return { kind: "per-method", program };
  }

  /** Return a flat-text Python equivalent of the given `program`. */
  static flatCodeText(
    program: PytchProgram,
    assets: Array<AssetMetaData>
  ): FlattenResults {
    switch (program.kind) {
      case "flat":
        return { codeText: program.text, mapEntries: [] };
      case "per-method": {
        return flattenProgram(program.program, assets);
      }
      default:
        return assertNever(program);
    }
  }

  /** Attempt to parse the given `json` string as the JSON
   * representation of a `PytchProgram`, and return the resulting
   * `PytchProgram` if successful.  If not successful, throw an error.
   * */
  static fromJson(json: string): PytchProgram {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = null;
    try {
      obj = JSON.parse(json);
    } catch {
      throw new Error("malformed JSON for PytchProgram");
    }

    if (!validatePytchProgramJson(obj)) {
      throw new Error("invalid JSON for PytchProgram");
    }

    return obj;
  }

  static async fingerprint(program: PytchProgram): Promise<string> {
    switch (program.kind) {
      case "flat": {
        const contentHash = await hexSHA256(program.text);
        return `program=flat/${contentHash}`;
      }
      case "per-method": {
        const suffix = await StructuredProgramOps.fingerprint(program.program);
        return `program=per-method/${suffix}`;
      }
      default:
        return assertNever(program);
    }
  }

  static ensureKind<KindT extends PytchProgram["kind"]>(
    label: string,
    program: PytchProgram,
    requiredKind: KindT
  ): PytchProgramOfKind<KindT> {
    const actualKind = program.kind;
    if (actualKind !== requiredKind)
      throw new Error(
        label +
          `: program should be of kind "${requiredKind}"` +
          ` but is of kind "${actualKind}"`
      );
    return program as PytchProgramOfKind<KindT>;
  }

  /** Return an array holding the "active" elements of the given
   * `assets` array, in the "canonical" order with respect to the given
   * `program`.
   *
   * For a "flat" program: All assets are active, and the canonical
   * order is the input order.  I.e., for "flat" programs, this function
   * just returns `assets`.
   *
   * For a "per-method" program: An asset is "active" if the _actorId_
   * part of its name is the id of an actor in the given `program`.  The
   * canonical order is first by actor, then by time (image/sound), then
   * by the order in the input.
   * */
  static assetsCanonicallyOrdered<AssetT extends AssetNameAndType>(
    program: PytchProgram,
    assets: Array<AssetT>
  ): Array<AssetT> {
    switch (program.kind) {
      case "flat":
        return assets;
      case "per-method": {
        // This filtering is only necessary because we don't clean up
        // old project-assets in the IndexedDB when the user deletes a
        // sprite.  We should.  Think will be able to do as a DB version
        // upgrade (even though it doesn't change the schema), and will
        // then be able to rely on there being no "inactive" assets.
        const activeAssets = StructuredProgramOps.filterActiveAssets(
          program.program,
          assets
        );
        const orderedAssetIndexes = StructuredProgramOps.canonicalAssetOrder(
          program.program,
          activeAssets
        );
        const orderedAssets = orderedAssetIndexes.map((i) => activeAssets[i]);
        return orderedAssets;
      }
    }
  }
}
