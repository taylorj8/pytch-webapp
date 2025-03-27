import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { Range } from "ace-builds";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import { useStoreState, useStoreActions } from "../store";
import {
  getFlatAceController,
  setFlatAceController,
} from "../skulpt-connection/code-editor";
import { PytchAceAutoCompleter } from "../skulpt-connection/code-completion";
import { failIfNull } from "../utils";
import { HelpSidebar, HelpSidebarOpenControl } from "./HelpSidebar";
import { equalILoadSaveStatus } from "../model/project";
import { LinkedContentBar } from "./LinkedContentBar";
import { useFlatCodeText } from "./hooks/code-text";
import { eqDisplaySize } from "../model/ui";
import { Debugger } from "../skulpt-connection/drive-project";

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
  // const inDebugMode = useStoreState(
  //   (state) => state.activeProject.inDebugMode
  // )
  const debugLine = useStoreState(
    (state) => state.activeProject.debugLine
  )
  const editSeqNum = useStoreState((state) => state.activeProject.editSeqNum);
  const lastSyncFromStorageSeqNum = useStoreState(
    (state) => state.activeProject.lastSyncFromStorageSeqNum
  );

  // We don't care about the actual value of the stage display size, but
  // we do need to know when it changes, so we can resize the editor in
  // our useEffect() call below.
  useStoreState((state) => state.ideLayout.stageDisplaySize, eqDisplaySize);

  const [prevMarker, setPrevMarker] = useState<number | null>(null);

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
    ace.editor.on("guttermousedown", (e: any) => {
      if (e.domEvent.target.className.indexOf("ace_gutter-cell") == -1) {
        return;
      }

      var row = e.getDocumentPosition().row;
      var breakpoints = e.editor.session.getBreakpoints(row, 0);

      // if breakpoint active, toggle it
      if (typeof breakpoints[row] === typeof undefined) {
        e.editor.session.setBreakpoint(row);
        Debugger.add_breakpoint("<stdin>.py", row+1, 0, false);
      } else {
        e.editor.session.clearBreakpoint(row);
        Debugger.clear_breakpoint("<stdin>.py", row+1, 0, false);
      }

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
    console.log("!!!!! CodeAceEditor effect: debugLine", debugLine);
    const ace = failIfNull(aceRef.current, "CodeEditor effect: aceRef is null");
    if (prevMarker !== null)
      ace.editor.session.removeMarker(prevMarker);

    if (debugLine !== null) {
      const marker = ace.editor.session.addMarker(new Range(debugLine-1, 0, debugLine-1, 1), "debugLine", "fullLine");
      setPrevMarker(marker);
    }
  }, [debugLine]);

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
        fontSize={16}
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

const CodeEditor = () => {
  return (
    <div className="CodeEditor">
      <LinkedContentBar />
      <div className="editor-itself">
        <div className="help-sidebar">
          <HelpSidebar />
          <HelpSidebarOpenControl />
        </div>
        <CodeAceEditor />
      </div>
    </div>
  );
};

export default CodeEditor;
