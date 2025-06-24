import { liveSourceMap } from "./code-editor";
import { PytchProgramOps } from "../model/pytch-program";
import { assetServer } from "./asset-server";
import { ensureSoundManager } from "./sound-manager";
import { ProjectContent } from "../model/project-core";
import { AssetPresentation } from "../model/asset";
import { Debugger } from "../skulpt-connection/drive-project";
import store from "../store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

const builtinRead = (fileName: string) => {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][fileName] === undefined
  ) {
    throw Error(`File not found: '${fileName}'`);
  }

  return Sk.builtinFiles["files"][fileName];
};

export enum BuildOutcomeKind {
  Success,
  Failure,
}

export class BuildOutcomeKindOps {
  static displayName(kind: BuildOutcomeKind) {
    switch (kind) {
      case BuildOutcomeKind.Success:
        return "success";
      case BuildOutcomeKind.Failure:
        return "failure";
      default:
        return "unknown";
    }
  }
}

interface BuildSuccess {
  kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
  kind: BuildOutcomeKind.Failure;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any; // TODO: Can we do better here?
}

export type BuildOutcome = BuildSuccess | BuildFailure;

export const build = async (
  project: ProjectContent<AssetPresentation>,
  addOutputChunk: (chunk: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleError: (pytchError: any, errorContext: any) => void,
  inDebugMode: boolean
): Promise<BuildOutcome> => {
  if (inDebugMode) {
    Sk.configure({
      __future__: Sk.python3,
      read: builtinRead,
      output: addOutputChunk,
      pytch: { on_exception: handleError },
      debugging: true,
      breakpoints: Debugger.check_breakpoints.bind(Debugger),
    });
  } else {
    // This also resets the current_live_project slot.
    Sk.configure({
      __future__: Sk.python3,
      read: builtinRead,
      output: addOutputChunk,
      pytch: { on_exception: handleError },
    });
  }

  try {
    ensureSoundManager();
    Sk.pytch.async_load_image = (name: string) => assetServer.loadImage(name);

    const flattenedProgram = PytchProgramOps.flatCodeText(
      project.program,
      project.assets
    );
    const codeText = flattenedProgram.codeText;
    liveSourceMap.setEntries(flattenedProgram.mapEntries);

    // todo - is this the best way to do this?
    // when program is built, translate the global position of all breakpoints and add them
    if (inDebugMode && project.program.kind === "per-method") {
      Debugger.clear_all_breakpoints();
      const breakpointStore = store.getState().activeProject.breakpointStore;
      breakpointStore.forEach((breakpointKey) => {
        const key = breakpointKey.split(":");
        const loc = {
          actorId: key[0],
          handlerId: key[1],
          lineWithinHandler: parseInt(key[2])
        };
        const globalLineNumber = liveSourceMap.globalFromLocal(loc);
        Debugger.add_breakpoint("<stdin>.py", globalLineNumber, 0, false);
        console.log(Debugger.get_breakpoints_list());
      });
    }

    await Sk.pytchsupport.import_with_auto_configure(codeText);
    Sk.pytch.current_live_project.on_green_flag_clicked();
    return { kind: BuildOutcomeKind.Success };
  } catch (err) {
    return { kind: BuildOutcomeKind.Failure, error: err };
  }
};
