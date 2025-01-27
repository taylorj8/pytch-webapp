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
