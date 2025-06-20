import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { Ace, Range } from "ace-builds";
import { PytchAceAutoCompleter } from "../../skulpt-connection/code-completion";

import {
  ActorKind,
  StructuredProgramOps,
  Uuid,
} from "../../model/junior/structured-program";
import { useStoreActions, useStoreState } from "../../store";

import {
  AceEditorT,
  aceControllerMap,
  pendingCursorWarp,
} from "../../skulpt-connection/code-editor";

import { HatBlock } from "./HatBlock";
import classNames from "classnames";

import {
  useJrEditActions,
  useMappedProgram,
  usePytchScriptDrag,
  usePytchScriptDrop,
} from "./hooks";

import PytchScriptPreview from "../../images/drag-preview-event-handler.png";
import { DragPreviewImage } from "react-dnd";
import { useNotableChanges } from "../hooks/notable-changes";
import { ConjoinedResizeObserver } from "../../model/junior/conjoined-resize-observer";
import { scrollCursorRowIntoView } from "./PytchScriptEditor-scroller";
import { failIfNull } from "../../utils";

import { Debugger } from "../../skulpt-connection/drive-project";
import { setDate } from "date-fns";

const MAIN_FILE = "<stdin>.py";

// Adapted from https://stackoverflow.com/a/71952718
const insertElectricFullStop = (editor: AceEditorT) => {
  editor.insert(".");
  editor.execCommand("startAutocomplete");
};

type PytchScriptEditorProps = {
  actorKind: ActorKind;
  actorId: Uuid;
  handlerId: Uuid;
  prevHandlerId: Uuid | null;
  nextHandlerId: Uuid | null;
  conjoinedResizeObserver: ConjoinedResizeObserver;
};
export const PytchScriptEditor: React.FC<PytchScriptEditorProps> = ({
  actorKind,
  actorId,
  handlerId,
  prevHandlerId,
  nextHandlerId,
  conjoinedResizeObserver,
}) => {
  const [dragProps, dragRef, preview] = usePytchScriptDrag(handlerId);
  const [dropProps, dropRef] = usePytchScriptDrop(actorId, handlerId);
  const aceParentRef: React.RefObject<HTMLDivElement> = React.createRef();
  const aceRef: React.RefObject<AceEditor> = React.createRef();

  const handler = useMappedProgram("<PytchScriptEditor>", (program) =>
    StructuredProgramOps.uniqueHandlerByIdGlobally(program, handlerId)
  );

  const setHandlerPythonCode = useStoreActions(
    (actions) => actions.activeProject.setHandlerPythonCode
  );
  const setMostRecentFocusedEditor = useJrEditActions(
    (a) => a.setMostRecentFocusedEditor
  );
  const scriptUpsertedChanges = useNotableChanges(
    "script-upserted",
    (change) => change.handlerId == handlerId
  );
  const justUpserted = scriptUpsertedChanges.length > 0;

  const updateCodeText = (code: string) => {
    setHandlerPythonCode({ actorId, handlerId, code });
  };

  const showDebugFeatures = useStoreState((state) => state.ideLayout.showDebugFeatures);
  const debugLine = useStoreState((state) => state.activeProject.debugLine);

  const [prevMarker, setPrevMarker] = useState<number | null>(null);

  useEffect(() => {
    const scroll = () => scrollCursorRowIntoView(handlerId);
    scroll();

    const aceParentDiv = aceParentRef.current;
    if (aceParentDiv == null) return;

    const inputDiv = aceParentDiv.querySelector(".ace_text-input");
    if (inputDiv == null) return;

    inputDiv.addEventListener("keydown", scroll);
    return () => inputDiv.removeEventListener("keydown", scroll);
  }, [aceParentRef]);

  useEffect(() => {
    const aceParentDiv = aceParentRef.current;
    if (aceParentDiv == null) return;

    if (!conjoinedResizeObserver.enabled) {
      // If the "all have resized" event has already fired, we don't
      // need to notify the conjoinedResizeObserver when we resize.
      return;
    }

    let resizeObserver: ResizeObserver | null = null;

    function disconnectObserver() {
      resizeObserver?.disconnect();
      resizeObserver = null;
    }

    resizeObserver = new ResizeObserver((_entries, _observer) => {
      conjoinedResizeObserver.acceptConjunctResizeEvent(handlerId);
      disconnectObserver();
    });

    resizeObserver.observe(aceParentDiv);

    conjoinedResizeObserver.addAllResizedHandler(() => {
      const maybeWarpTarget = pendingCursorWarp.acquireIfForHandler(handlerId);
      if (maybeWarpTarget == null) {
        return;
      }

      const controller = aceControllerMap.get(handlerId);
      if (controller == null) {
        console.log("could not find controller for", handlerId);
        return;
      }

      controller.scrollIntoView(maybeWarpTarget.lineNo);
      controller.gotoLocation(maybeWarpTarget.lineNo, maybeWarpTarget.colNo);
      controller.focus();
    });

    return disconnectObserver;
  }, [aceParentRef, conjoinedResizeObserver]);

  // todo remove duplication with CodeEditor.tsx
  useEffect(() => {
    const ace = failIfNull(aceRef.current, "PytchScriptEditor effect: aceRef is null");
    console.log(aceRef);

    // toggleable breakpoints
    ace.editor.on("guttermousedown", (e) => {
      if (!showDebugFeatures || e.domEvent.target.className.indexOf("ace_gutter-cell") == -1)
        return;

      const row = e.getDocumentPosition().row + 1;

      if (Debugger.check_breakpoints(handlerId, row, 0)) {
        Debugger.clear_breakpoint(handlerId, row, 0, false);
        ace.editor.session.clearBreakpoint(row - 1);
      } else {
        Debugger.add_breakpoint(handlerId, row, 0, false);
        ace.editor.session.setBreakpoint(row - 1, "ace_breakpoint");
      }

      // console.log(Debugger.dbg_breakpoints);
      // console.log(ace.editor.session.getBreakpoints());
      
      e.stop();
    });

    // ensures the breakpoint tracks the code rather than the line number
    (ace.editor.session as any).on("change", (delta: Ace.Delta) => {
      if (delta.end.row == delta.start.row) return;
      const updatedBreakpoints = new Set<number>();
      const breakpoints = Debugger.get_breakpoints_list();

      let breakpointMoved = false;
      Object.values(breakpoints).forEach((breakpoint: any) => {
        const row = breakpoint.lineno;
        
        if (delta.start.row >= row) {
          updatedBreakpoints.add(row);
        } else if (delta.action === "insert") {

          const linesAdded = delta.end.row - delta.start.row;
          updatedBreakpoints.add(row + linesAdded)
          breakpointMoved = true;

        } else if (delta.action === "remove") {

          const linesRemoved = delta.end.row - delta.start.row;
          const newRow = row - linesRemoved;
          if (newRow >= delta.start.row) {
            updatedBreakpoints.add(newRow);
            breakpointMoved = true;
          } else {
            updatedBreakpoints.add(row);
          }

        }
      });
      
      if (breakpointMoved) {
        Debugger.clear_all_breakpoints();
        ace.editor.session.clearBreakpoints();

        updatedBreakpoints.forEach((breakpoint) => {
          Debugger.add_breakpoint(MAIN_FILE, breakpoint, 0, false);
          ace.editor.session.setBreakpoint(breakpoint - 1, "ace_breakpoint")
        });
      }
    });
  }, []);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");
    if (prevMarker !== null)
      ace.editor.session.removeMarker(prevMarker);

    if (debugLine !== null) {
      const marker = ace.editor.session.addMarker(new Range(debugLine-1, 0, debugLine-1, 1), "debugLine", "fullLine");
      setPrevMarker(marker);
    }
  }, [debugLine]);

  // replaces breakpoints when switching between actors
  useEffect(() => {
    const ace = failIfNull(aceRef.current, "Ace ref is null in breakpoints sync");
    ace.editor.session.clearBreakpoints();
    
    // Get all breakpoints for this handler
    Object.values(Debugger.get_breakpoints_list()).forEach((breakpoint: any) => {
      if (breakpoint.filename === handlerId) {
        ace.editor.session.setBreakpoint(breakpoint.lineno - 1, "ace_breakpoint");
      }
    });
  }, [actorId]);

  /** Once the editor has loaded, there are a few things we have to do:
   *
   * * Make an entry in the EventHandlerId->Editor map.
   * * Check whether there is a pending cursor-warp request (from the
   *   user clicking on an error-location button).
   * * Turn off "overwrite" mode.
   * * Mark the parent DIV such that e2e tests know everything is ready;
   *   there was some test flakiness which this seemed to help, but the
   *   flakiness was hard to reproduce so not certain.
   *
   * **TODO: Can some of this be unified with the set-up of the Ace
   * editor in "flat" mode?**
   */
  const onAceEditorLoad = (editor: AceEditorT) => {
    aceControllerMap.set(handlerId, editor);

    editor.session.setOverwrite(false);
    editor.commands.removeCommand("overwrite", true);

    editor.commands.addCommand({
      name: "insertElectricFullStop",
      bindKey: { mac: ".", win: "." },
      exec: insertElectricFullStop,
    });

    // Not sure how reliably this is true, but the onLoad seems to fire
    // before aceParentRef is set.  In dev mode, this is OK because
    // React renders everything twice, but when testing against a
    // production build, we don't ever set the attribute.  Poll until we
    // can.  (Messy but seems to be working.)
    function setLoadFiredAttr() {
      const mDiv = aceParentRef.current;
      if (mDiv != null) mDiv.setAttribute("data-on-load-fired", "yes");
      else setTimeout(setLoadFiredAttr, 20);
    }
    setLoadFiredAttr();
  };

  const onAceEditorFocus = () => {
    setMostRecentFocusedEditor(handlerId);
  };

  const nCodeLines = handler.pythonCode.split("\n").length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completers = [new PytchAceAutoCompleter() as any];

  const classes = classNames(
    "PytchScriptEditor",
    dragProps,
    dropProps,
    justUpserted && "recent-change-script-upserted"
  );

  // Under live-reload development, the preview image only works the
  // first time you drag a particular script.  It works correctly in a
  // static preview or release build.

  const aceParentDivId = `aceParent-${handler.id}`;

  return (
    <>
      <DragPreviewImage connect={preview} src={PytchScriptPreview} />
      <div className={classes}>
        <div ref={dropRef}>
          <div ref={dragRef}>
            <HatBlock
              actorId={actorId}
              actorKind={actorKind}
              handlerId={handlerId}
              prevHandlerId={prevHandlerId}
              nextHandlerId={nextHandlerId}
              event={handler.event}
            />
          </div>
        </div>
        <div className="drag-masked-editor">
          <div ref={aceParentRef} id={aceParentDivId}>
            <div className="hat-code-spacer" />
            <AceEditor
              ref={aceRef}
              mode="python"
              theme="pytch"
              enableBasicAutocompletion={completers}
              value={handler.pythonCode}
              onChange={updateCodeText}
              name={`ace-${handler.id}`}
              onLoad={onAceEditorLoad}
              onFocus={onAceEditorFocus}
              fontSize={14}
              width="100%"
              height="100%"
              minLines={nCodeLines}
              maxLines={nCodeLines}
            />
          </div>
          <div className="drag-mask" />
        </div>
      </div>
    </>
  );
};
