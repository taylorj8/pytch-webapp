function isNull<T>(x: T | null, xName: string): x is null {
  if (x == null) console.log(`${xName} is null`);
  return x == null;
}
