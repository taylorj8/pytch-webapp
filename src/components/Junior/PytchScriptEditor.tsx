import React, { useEffect, useReducer, useRef, useState } from "react";
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
  liveSourceMap,
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
import { userFile } from "../../constants";
import { BreakpointRecord, BreakpointStore } from "../../model/project";
import { PytchProgramOps } from "../../model/pytch-program";

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

  const debugFeaturesEnabled = useStoreState((state) => state.ideLayout.debugFeaturesEnabled);
  const { debugLine, inDebugMode } = useStoreState((state) => state.activeProject);

  const breakpointStore = useStoreState((state) => {
    return PytchProgramOps.ensureKind(
      "PytchScriptEditor",
      state.activeProject.project.program,
      "per-method"
    ).breakpointStore;
  });
  const { setBreakpointStore, addBreakpoint, removeBreakpoint } = useStoreActions((actions) => actions.activeProject);

  const [prevMarker, setPrevMarker] = useState<number>(-1);

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
      controller.gotoLocation(maybeWarpTarget.lineNo, maybeWarpTarget.colNo, true);
      controller.focus();
    });

    return disconnectObserver;
  }, [aceParentRef, conjoinedResizeObserver]);

  function hasBreakpoint(breakpointStore: BreakpointStore, breakpoint: BreakpointRecord) {
    return (
      breakpointStore[breakpoint.actorId] && breakpointStore[breakpoint.actorId][breakpoint.handlerId] &&
      breakpointStore[breakpoint.actorId][breakpoint.handlerId].includes(breakpoint.lineNo)
    );
  }

  const breakpointStoreRef = useRef(breakpointStore);
  const debugFeaturesEnabledRef = useRef(debugFeaturesEnabled);
  
  // todo remove duplication with CodeEditor.tsx
  useEffect(() => {
    const ace = failIfNull(aceRef.current, "PytchScriptEditor effect: aceRef is null");

    // toggleable breakpoints
    ace.editor.on("guttermousedown", (e) => {
      if (!debugFeaturesEnabledRef.current || e.domEvent.target.className.indexOf("ace_gutter-cell") == -1)
        return;

      const row = e.getDocumentPosition().row;
      const breakpointRecord = { actorId: actorId, handlerId: handlerId, lineNo: row + 1};

      let globalLineNo: number | null = null;
      try {
        globalLineNo = liveSourceMap.globalFromLocal({
          actorId: actorId,
          handlerId: handlerId,
          lineWithinHandler: row + 1,
        });
      } catch (err) {
        globalLineNo = null;
      }

      // breakpoints are added to a separate store and set in the debugger on build
      // they are also set directly to the debugger to handle the case when a
      // breakpoint is added while the program is running
      if (hasBreakpoint(breakpointStoreRef.current, breakpointRecord)) {
        ace.editor.session.clearBreakpoint(row);
        removeBreakpoint(breakpointRecord);
        if (globalLineNo !== null) {
          Debugger.clear_breakpoint(userFile, globalLineNo, 0, false);
        }
      } else {
        const lines = ace.editor.session.getDocument().getAllLines();
        // if a line is empty don't let a breakpoint be set there
        if (lines[row].trim() !== "") {
          ace.editor.session.setBreakpoint(row, "ace_breakpoint");
          addBreakpoint(breakpointRecord);
          if (globalLineNo !== null) {
            Debugger.add_breakpoint(userFile, globalLineNo, 0);
          }
        }
      }

      e.stop();
    });

    // ensures the breakpoint tracks the code rather than the line number
    (ace.editor.session as any).on("change", (delta: Ace.Delta) => {
    // Get all breakpoints for this handler
    const updatedStore = breakpointStoreRef.current;
    const handlerBreakpoints =
      updatedStore[actorId] && updatedStore[actorId][handlerId]
        ? updatedStore[actorId][handlerId]
        : [];

    const lines = ace.editor.session.getDocument().getAllLines();
    // find breakpoints on empty lines
    const breakpointsOnEmpty = handlerBreakpoints.filter((lineNo: number) => {
      const lineIndex = lineNo - 1;
      return lines[lineIndex] !== undefined && lines[lineIndex].trim() === "";
    });

    // if no breakpoints on empty lines and no change to line numbers, skip update
    if (breakpointsOnEmpty.length === 0 && delta.end.row === delta.start.row) return;

    const updatedBreakpoints: number[] = [];
    let breakpointsUpdated = false;
    handlerBreakpoints.forEach((lineNo: number) => {
      if (delta.start.row > lineNo - 1) {
        updatedBreakpoints.push(lineNo);
      } else if (delta.action === "insert") {
        // if new line entered at beginning of line, breakpoint should move
        const beforeCursor = lines[delta.start.row].slice(0, delta.start.column);
        if (delta.start.row === lineNo - 1 && beforeCursor.trim() !== "") {
          updatedBreakpoints.push(lineNo);
        } else {
          const linesAdded = delta.end.row - delta.start.row;
          updatedBreakpoints.push(lineNo + linesAdded);
          breakpointsUpdated = true;
        }
      } else if (delta.action === "remove") {
        const linesRemoved = delta.end.row - delta.start.row;
        const newRow = lineNo - linesRemoved;
        if (newRow > delta.start.row) {
          updatedBreakpoints.push(newRow);
          breakpointsUpdated = true;
        } else {
          updatedBreakpoints.push(lineNo);
        }
      } else {
        updatedBreakpoints.push(lineNo);
      }
    });

    // filter out breakpoints on empty lines
    const filteredBreakpoints = updatedBreakpoints.filter((lineNo) => {
      return lines[lineNo - 1] !== undefined && lines[lineNo - 1].trim() !== "";
    });
    if (filteredBreakpoints.length !== updatedBreakpoints.length) {
      breakpointsUpdated = true;
    }

    if (breakpointsUpdated) {
      updatedStore[actorId][handlerId] = filteredBreakpoints;
      setBreakpointStore(updatedStore);
      ace.editor.session.clearBreakpoints();
      filteredBreakpoints.forEach((lineNo) => {
        ace.editor.session.setBreakpoint(lineNo - 1, "ace_breakpoint");
      });
    }
  });
}, []);

  // assign a different class to empty lines so breakpoint hover can be hidden 
  useEffect(() => {
    const ace = aceRef.current?.editor;
    if (!ace) return;

    const updateEmptyDecorations = () => {
      const lines = ace.session.getDocument().getAllLines();
      
      lines.forEach((line, row) => {
        if (line.trim() === "") {
          ace.session.addGutterDecoration(row, "ace_gutter_empty");
        
          // remove breakpoint if the line is now empty
          if (Debugger.check_breakpoints(userFile, row + 1, 0)) {
            Debugger.clear_breakpoint(userFile, row + 1, 0, false);
            ace.session.clearBreakpoint(row);
          }
        } else {
          ace.session.removeGutterDecoration(row, "ace_gutter_empty");
        }
      });
    };

    updateEmptyDecorations();
    ace.getSession().on("change", updateEmptyDecorations);
    return () => ace.getSession().off("change", updateEmptyDecorations);
  }, []);

  useEffect(() => {
    breakpointStoreRef.current = breakpointStore;
  }, [breakpointStore]);

  useEffect(() => {
    debugFeaturesEnabledRef.current = debugFeaturesEnabled;

    const ace = aceRef.current?.editor;
    if (!ace) return;

    const gutter = (ace.renderer as any).$gutterLayer.element as HTMLElement;
    if (debugFeaturesEnabled) {
      gutter.classList.add("debug_enabled");
    } else {
      gutter.classList.remove("debug_enabled");
    }
  }, [debugFeaturesEnabled]);

  useEffect(() => {
    if (!inDebugMode) {
      return;
    }
    const controller = aceControllerMap.get(handlerId);
    if (controller == null) {
      return;
    }

    if (debugLine === -1) {
      controller.clearDebugMarker();
      return;
    }

    try {
      const debugLineLoc = liveSourceMap.localFromGlobal(debugLine);
      if (
        debugLineLoc.actorId === actorId &&
        debugLineLoc.handlerId === handlerId
      ) {
        const range = new Range(
          debugLineLoc.lineWithinHandler - 1,
          0,
          debugLineLoc.lineWithinHandler - 1,
          1
        );
        controller.setDebugMarker(range);
      } else {
        // The debug line is in another editor.
        controller.clearDebugMarker();
      }
    } catch (err) {
      // This can happen if the debugLine is not in the source map.
      controller.clearDebugMarker();
    }
  }, [debugLine]);

  // replaces breakpoints when switching between actors
  useEffect(() => {
    const ace = failIfNull(aceRef.current, "Ace ref is null in breakpoints sync");
    ace.editor.session.clearBreakpoints();

    if (breakpointStore[actorId] && breakpointStore[actorId][handlerId]) {
      breakpointStore[actorId][handlerId].forEach((lineNo) => {
        ace.editor.session.setBreakpoint(lineNo - 1, "ace_breakpoint");
      });
    }
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
