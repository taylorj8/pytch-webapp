function isNull<T>(x: T | null, xName: string): x is null {
  if (x == null) console.log(`${xName} is null`);
  return x == null;
}

const aceRowSelector = (row1b: number) =>
  `.ace_text-layer .ace_line:nth-child(${row1b})`;

function hasLiveCursor(parentDiv: HTMLElement): boolean {
  // scrollCursorRowIntoView() can get called when the editor does not
  // have the focus, e.g., when expanding or collapsing the info panel.
  const maybeLiveCursors = parentDiv.querySelector(
    ".ace_cursor-layer:not(.ace_hidden-cursors)"
  );
  // This is expected so don't log() if null:
  return maybeLiveCursors != null;
}

interface VerticalRange {
  top: number;
  bottom: number;
}
