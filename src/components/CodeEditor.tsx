import React, { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";
import { Ace, Range } from "ace-builds";
import { useStoreState, useStoreActions } from "../store";
import {
  getFlatAceController,
  setFlatAceController,
} from "../skulpt-connection/code-editor";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";
import { failIfNull } from "../utils";
import { equalILoadSaveStatus } from "../model/project";
import { useFlatCodeText } from "./hooks/code-text";
import { eqDisplaySize } from "../model/ui";
import { SingleTab } from "./SingleTab";
import { Debugger } from "../skulpt-connection/drive-project";
import { userFile } from "../constants";
import { resetDebugging } from "./StageControls";
import { PytchProgramOps } from "../model/pytch-program";

const ReadOnlyOverlay = () => {
  const syncState = useStoreState(
    (state) => state.activeProject.syncState,
    equalILoadSaveStatus
  );

  // TODO: Handle "failed" state.
  const maybeMessage =
    syncState.loadState === "pending"
      ? "Loading..."
      : syncState.saveState === "pending"
        ? "Saving..."
        : null;

  if (maybeMessage != null) {
    return (
      <div className="ReadOnlyOverlay">
        <p>{maybeMessage}</p>
      </div>
    );
  }
  return null;
};

const CodeAceEditor = () => {
  const codeText = useFlatCodeText("CodeAceEditor");
  const aceRef: React.RefObject<AceEditor> = React.createRef();

  const saveIsPending = useStoreState(
    (state) => state.activeProject.syncState.loadState === "pending"
  );
  const debugLine = useStoreState(
    (state) => state.activeProject.debugLine
  )
  const editSeqNum = useStoreState((state) => state.activeProject.editSeqNum);
  const lastSyncFromStorageSeqNum = useStoreState(
    (state) => state.activeProject.lastSyncFromStorageSeqNum
  );
  const debugFeaturesEnabled = useStoreState((state) => state.ideLayout.debugFeaturesEnabled);

  // We don't care about the actual value of the stage display size, but
  // we do need to know when it changes, so we can resize the editor in
  // our useEffect() call below.
  useStoreState((state) => state.ideLayout.stageDisplaySize, eqDisplaySize);

  const [prevMarker, setPrevMarker] = useState<number | null>(null);
  const debugFeaturesEnabledRef = useRef(debugFeaturesEnabled);

  const previousBreakpoints = useStoreState((state) => {
      const program = state.activeProject.project.program;
      return PytchProgramOps.ensureKind(
        "CodeEditor",
        program,
        "flat"
      ).breakpointList;
    });

  // load breakpoints from previous session
  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");
    // Clear all breakpoints first
    Debugger.clear_all_breakpoints();
    // Add breakpoints from the loaded project
    if (previousBreakpoints === undefined) return;
    previousBreakpoints.forEach((lineNo) => {
      Debugger.add_breakpoint(userFile, lineNo, 0, false);
      ace.editor.session.setBreakpoint(lineNo - 1, "ace_breakpoint")
    });
  }, [previousBreakpoints]);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");

    ace.editor.resize();

    ace.editor.commands.addCommand({
      name: "buildAndGreenFlag",
      bindKey: { mac: "Ctrl-Enter", win: "Ctrl-Enter" },
      exec: () => build({ focusDestination: "running-project", inDebugMode: false }),
    });
    ace.editor.commands.addCommand({
      name: "buildAndGreenFlagKeepFocus",
      bindKey: { mac: "Ctrl-Shift-Enter", win: "Ctrl-Shift-Enter" },
      exec: () => build({ focusDestination: "editor", inDebugMode: false }),
    });
    ace.editor.commands.addCommand({
      name: "copySelectionAsHtml",
      bindKey: { mac: "Cmd-Shift-c", win: "Ctrl-Shift-c" },
      exec: async () => {
        await getFlatAceController()?.copySelectionAsHtml();
      },
    });

    // toggleable breakpoints
    ace.editor.on("guttermousedown", (e) => {
      if (!debugFeaturesEnabledRef.current || e.domEvent.target.className.indexOf("ace_gutter-cell") == -1)
        return;

      let row = e.getDocumentPosition().row + 1;

      if (Debugger.check_breakpoints(userFile, row, 0)) {
        Debugger.clear_breakpoint(userFile, row, 0, false);
        ace.editor.session.clearBreakpoint(row - 1);
      } else {
        Debugger.add_breakpoint(userFile, row, 0, false);
        ace.editor.session.setBreakpoint(row - 1, "ace_breakpoint");
      }

      console.log(Debugger.get_breakpoints_list())

      e.stop();
    });

    // It seems common to have not ever heard of "overwrite" mode.  If
    // it gets turned on by mistake, people often get confused.  Ensure
    // we are in "insert" mode, and also remove any bindings for the
    // command which toggles overwrite.
    ace.editor.session.setOverwrite(false);
    ace.editor.commands.removeCommand("overwrite", true);

    if (editSeqNum === lastSyncFromStorageSeqNum) {
      ace.editor.session.getUndoManager().reset();
    }
  });

  useEffect(() => {
    debugFeaturesEnabledRef.current = debugFeaturesEnabled;
  }, [debugFeaturesEnabled]);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");
    if (prevMarker !== null)
      ace.editor.session.removeMarker(prevMarker);

    if (debugLine !== null) {
      const marker = ace.editor.session.addMarker(new Range(debugLine - 1, 0, debugLine - 1, 1), "debugLine", "fullLine");
      setPrevMarker(marker);
    }
  }, [debugLine]);

  useEffect(() => {
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");

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
          Debugger.add_breakpoint(userFile, breakpoint, 0, false);
          ace.editor.session.setBreakpoint(breakpoint - 1, "ace_breakpoint")
        });
      }
    });
  }, [])

  // clean-up when leaving the page - clears breakpoints and debugline
  useEffect(() => {
    return () => {
      Debugger.clear_all_breakpoints();
      resetDebugging(false);
    };
  }, []);

  const { build, setCodeText } = useStoreActions(
    (actions) => actions.activeProject
  );

  const updateCodeText = (text: string) => {
    setCodeText(text);
  };

  // (The cast "as any" is because the "enableBasicAutocompletion" prop
  // is typed as taking either a boolean or an array of strings, whereas
  // it will in fact take an array of class instances, which is how we
  // use it here.)
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completers = [new PytchAceAutoCompleter() as any];

  return (
    <>
      <AceEditor
        ref={aceRef}
        mode="python"
        theme="pytch"
        enableBasicAutocompletion={completers}
        value={codeText}
        name="pytch-ace-editor"
        fontSize={14}
        width="100%"
        height="100%"
        onLoad={setFlatAceController}
        onChange={updateCodeText}
        readOnly={saveIsPending}
      />
      <ReadOnlyOverlay />
    </>
  );
};

export const CodeEditor = () => {
  return (
    <div className="CodeEditor compact-tablist-container">
      <SingleTab title="Code">
        <div className="abs-0000">
          <CodeAceEditor />
        </div>
      </SingleTab>
    </div>
  );
};
