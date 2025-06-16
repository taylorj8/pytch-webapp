import { aceControllerMap } from "../../skulpt-connection/code-editor";

const kIdealCursorClearance = 65;

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

function impliedRowRange(
  parentDiv: HTMLElement,
  targetRow1b: number,
  fontSizeStr: string
): VerticalRange | null {
  const fontSize = parseFloat(fontSizeStr);
  if (isNaN(fontSize)) return null;

  const maybeFirstRow = parentDiv.querySelector(aceRowSelector(1));
  if (maybeFirstRow == null) return null;

  const firstRowRect = maybeFirstRow.getBoundingClientRect();
  const nRowsOffset = targetRow1b - 1;
  return {
    top: firstRowRect.top + nRowsOffset * fontSize,
    bottom: firstRowRect.bottom + nRowsOffset * fontSize,
  };
}

export function scrollCursorRowIntoView(handlerId: string) {
  const editor = aceControllerMap.get(handlerId);
  if (isNull(editor, `editor[${handlerId}]`)) return;

  const parentDivId = `aceParent-${handlerId}`;
  const parentDiv = document.getElementById(parentDivId);
  if (isNull(parentDiv, "parentDiv")) return;

  // Only scroll the editor if it has focus.
  if (!hasLiveCursor(parentDiv)) return;

  const codeEditorDiv = document.querySelector(".Junior-CodeEditor");
  if (isNull(codeEditorDiv, "codeEditorDiv")) return;

  const cursorRow1b = editor.getCursorPosition().row + 1;
  const cursorLine = parentDiv.querySelector(aceRowSelector(cursorRow1b));

  // Sometimes the cursor row element does not exist, for example when
  // pressing Enter while on the currently-last line of a script, or
  // when pasting.  In that case, fall back to a calculation for where
  // we think the row containing the cursor will be.
  const cursorLineRect =
    cursorLine != null
      ? cursorLine.getBoundingClientRect()
      : impliedRowRange(parentDiv, cursorRow1b, editor.getFontSize());
  if (isNull(cursorLineRect, "cursorLineRect")) return;

  const codeEditorRect = codeEditorDiv.getBoundingClientRect();

  const requiredClearance = Math.min(
    Math.floor(codeEditorRect.height / 3),
    kIdealCursorClearance
  );

  const clearanceAbove = cursorLineRect.top - codeEditorRect.top;
  if (clearanceAbove < requiredClearance) {
    const top = codeEditorDiv.scrollTop - requiredClearance + clearanceAbove;
    codeEditorDiv.scrollTo({ top });
  }

  const clearanceBelow = codeEditorRect.bottom - cursorLineRect.bottom;
  if (clearanceBelow < requiredClearance) {
    const top = codeEditorDiv.scrollTop + requiredClearance - clearanceBelow;
    codeEditorDiv.scrollTo({ top });
  }
}
