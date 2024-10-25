function isNull<T>(x: T | null, xName: string): x is null {
  if (x == null) console.log(`${xName} is null`);
  return x == null;
}

const aceRowSelector = (row1b: number) =>
  `.ace_text-layer .ace_line:nth-child(${row1b})`;
