/** This is an unpleasant fudge to allow us to move the editor's cursor
 * to a particular line. */

import { IAceEditorProps } from "react-ace";
import { PYTCH_CYPRESS, ancestorHavingClass } from "../utils";
import { LocationWithinHandler, SourceMap, Uuid } from "../model/junior/structured-program";
import { PendingCursorWarp } from "../model/junior/structured-program";

import {
  lineAsElement,
  lineIntersectsSelection,
} from "../model/highlight-as-ace";
import { Ace } from "ace-builds";;
import store from "../store";

// Is this defined somewhere I can get at it?
export type AceEditorT = Parameters<Required<IAceEditorProps>["onLoad"]>[0];

const kPytchCypressControllerMapKey = "ACE_CONTROLLER_MAP";
const kFlatEditorId = "flat";

class AceController {
  private debugMarkerId: number | null = null;

  constructor(readonly editor: AceEditorT) {}

  gotoLocation(lineNo: number, colNo: number | null, shouldFocus: boolean) {
    if (colNo == null) {
      this.gotoLine(lineNo, shouldFocus);
    } else {
      this.gotoLineAndColumn(lineNo, colNo, shouldFocus);
    }
  }

  gotoLine(lineNo: number, shouldFocus: boolean) {
    this.editor.gotoLine(lineNo, 0, true);
    if (shouldFocus) {
      this.focus();
    }
  }

  gotoLineAndColumn(lineNo: number, colNo: number, shouldFocus: boolean) {
    this.editor.gotoLine(lineNo, colNo, true);
    if (shouldFocus) {
      this.focus();
    }
  }

  setDebugMarker(range: Ace.Range) {
    this.clearDebugMarker();
    this.debugMarkerId = this.editor.session.addMarker(
      range,
      "debugLine",
      "fullLine"
    );
    console.log("SET " + this.debugMarkerId)
  }

  clearDebugMarker() {
    console.log("marker: " + this.debugMarkerId)
    if (this.debugMarkerId != null) {
      this.editor.session.removeMarker(this.debugMarkerId);
      this.debugMarkerId = null;
    }
  }

  focus() {
    this.editor.focus();
  }

  getCursorPosition() {
    return this.editor.getCursorPosition();
  }

  getFontSize() {
    return this.editor.getFontSize();
  }

  static kScrollIntoViewLinesBelow = 2.5;

  scrollIntoView(targetLineNo: number) {
    // Scroll such that the hat-block of the target script is at the top
    // of the IDE pane.  If that leaves the target line partially hidden
    // behind the "add something" button strip, or beyond the bottom of
    // the viewport, we move the viewport lower until the target line is
    // a small distance above the top of the "add something" button
    // strip.

    // The below is fragile and coupled in the sense that it relies on
    // the structure of how the editors are contained within the
    // Junior-CodeEditor. It will only work for the per-method IDE.

    const lineIdx = targetLineNo - 1;
    const aceContainer = this.editor.container;

    const codePanelElt = aceContainer.offsetParent as HTMLElement | null;
    if (codePanelElt == null) {
      return; // Should not happen.
    }
    const blurStripElt = codePanelElt.querySelector(
      ".AddSomethingButtonStrip"
    ) as HTMLElement;

    const nCodeLines = this.editor.getSession().getLength();
    const lineStride = aceContainer.offsetHeight / nCodeLines;

    const targetLineGlobalTop = aceContainer.offsetTop + lineIdx * lineStride;
    const codePanelUnblurredHeight =
      codePanelElt.offsetHeight - blurStripElt.offsetHeight;

    const scriptEditorElt = ancestorHavingClass(
      aceContainer,
      "PytchScriptEditor"
    );
    const scriptScrollTop = scriptEditorElt.offsetTop;

    const targetLineScrollTop =
      targetLineGlobalTop -
      codePanelUnblurredHeight +
      AceController.kScrollIntoViewLinesBelow * lineStride;
    const effectiveScrollTop = Math.max(targetLineScrollTop, scriptScrollTop);

    codePanelElt.scrollTo(0, effectiveScrollTop);
  }

  value(): string {
    return this.editor.getValue();
  }

  async copySelectionAsHtml() {
    let preElt = document.createElement("pre");
    preElt.setAttribute("style", "font-family:monospace;");

    const selection = this.editor.getSelection().getAllRanges();
    const nLines = this.editor.session.getDocument().getLength();
    for (let i = 0; i !== nLines; ++i) {
      if (!lineIntersectsSelection(i, selection)) {
        continue;
      }

      const tokens = this.editor.session.getTokens(i);
      const codeElt = lineAsElement(tokens);
      preElt.appendChild(codeElt);
      preElt.appendChild(document.createTextNode("\n"));
    }

    const type = "text/html";
    const blob = new Blob([preElt.outerHTML], { type });
    const items = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(items);
  }
}

// Uuid is already just string, but this expresses the intent:
type EditorId = Uuid | typeof kFlatEditorId;

export class AceControllerMap {
  controllerFromHandlerId: Map<EditorId, AceController>;

  constructor() {
    this.controllerFromHandlerId = new Map<Uuid, AceController>();
  }

  set(editorId: EditorId, editor: AceEditorT) {
    const controller = new AceController(editor);
    this.controllerFromHandlerId.set(editorId, controller);

    // For e2e tests, allow direct access to the controllers, and to the
    // editor interface for setting flat project text, via the global
    // PYTCH_CYPRESS object.  This was not the first thing I tried and
    // it's not particularly clean, but it seems to be working.

    // Provide access to the current controller map.
    PYTCH_CYPRESS()[kPytchCypressControllerMapKey] = this;

    // Special-case the situation where we set the "flat" controller, to
    // allow existing tests to keep working.
    if (editorId === kFlatEditorId) {
      PYTCH_CYPRESS()["ACE_CONTROLLER"] = editor;
    }

    return controller;
  }

  get(editorId: EditorId) {
    // Return null rather than undefined:
    return this.controllerFromHandlerId.get(editorId) ?? null;
  }

  deleteExcept(keepEditorIds: Array<EditorId>) {
    // Probably not worth converting the given Ids to a map, since we
    // don't expect very many of them.
    const allIds = Array.from(this.controllerFromHandlerId.keys());
    allIds.forEach((editorId) => {
      if (!keepEditorIds.includes(editorId)) {
        this.controllerFromHandlerId.delete(editorId);
      }
    });
  }

  clear() {
    // Delegate to deleteExcept() to keep the logic for special-case Ace
    // instances in one place.
    this.deleteExcept([]);
  }

  nonSpecialEditorIds() {
    const allIds = Array.from(this.controllerFromHandlerId.keys());
    return allIds.filter((editorId) => editorId !== "flat");
  }
}

export let aceControllerMap = new AceControllerMap();

export const getFlatAceController = () => aceControllerMap.get("flat");
export const setFlatAceController = (editor: AceEditorT) =>
  aceControllerMap.set("flat", editor);

export let liveSourceMap = new SourceMap();
export let pendingCursorWarp = new PendingCursorWarp();

// todo - is this the best location for this?
// function to move the user to a location in the program
export function goToEditorLocation(
  contextualLoc: LocationWithinHandler,
  localColNo: number | null,
  shouldFocus: boolean
) {
  const maybeController = aceControllerMap.get(contextualLoc.handlerId);

    // If we're already displaying the Ace editor for this script, warp
    // its cursor.  Otherwise, note a warp request and switch to the
    // correct actor and property-tab --- this also covers the case that
    // the correct actor is active but not the Code tab.
  if (maybeController != null) {
    maybeController.gotoLocation(contextualLoc.lineWithinHandler, localColNo, shouldFocus);
    if (shouldFocus) {
      maybeController.focus();
    }
    maybeController.scrollIntoView(contextualLoc.lineWithinHandler);
  } else {
    pendingCursorWarp.set({
      handlerId: contextualLoc.handlerId,
      lineNo: contextualLoc.lineWithinHandler,
      colNo: localColNo,
    });
    store.getActions().jrEditState.setFocusedActor(contextualLoc.actorId);
    store.getActions().jrEditState.setActorPropertiesActiveTab("code");
  }
}
