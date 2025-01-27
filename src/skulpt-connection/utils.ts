import { AssetNames } from "../model/junior/structured-program/asset";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

/** Return a string suitable for inclusion in Python code text which
 * Python will interpret as a string literal having the given JavaScript
 * `str` as its contents.
 *
 * Examples:
 *
 * * `"hello world"` ↦ `'hello world'`
 * * `"hello ' world"` ↦ `'hello \' world'`
 * */
export function pyStringRepr(str: string): string {
  const pyStr = new Sk.builtin.str(str);
  return pyStr.$r().v;
}

/** Return a snippet of Python code which represents a two-element
 * literal tuple, whose first element is a string literal representing
 * the `basename` of the given `assetNames`, and whose second element is
 * a string literal representing the `fullPathname` of the given
 * `assetNames`.
 *
 * Example:
 *
 * * `{basename: "red.png", fullPathname: "space-alien/red.png"}` ↦
 *   `('red.png', 'space-alien/red.png')`
 * */
export function assetNamesTupleLiteral(assetNames: AssetNames): string {
  const basenameRepr = pyStringRepr(assetNames.basename);
  const fullPathnameRepr = pyStringRepr(assetNames.fullPathname);
  return `(${basenameRepr}, ${fullPathnameRepr})`;
}
