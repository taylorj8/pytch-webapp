import React from "react";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Debugger } from "../skulpt-connection/drive-project";
import { faEject, faShoePrints } from '@fortawesome/free-solid-svg-icons';

declare let Sk: any;

export const DebugButtons = () => {
  const project = Sk.pytch.current_live_project
  const setDebugState = useStoreActions((actions) => actions.activeProject.setDebugState)
  const setDebugLine = useStoreActions((actions) => actions.activeProject.setDebugLine)

  const continueCallback = () => {
    setDebugLine(-1)
    project.allow_all_threads_listening()
    Debugger.disable_step_mode()
    setDebugState("debugging")
    project.continue_on_breakpoint()
  }

  const stepCallback = () => {
    Debugger.enable_step_mode()
    setDebugState("debugging")
    project.continue_on_breakpoint()
  }

  return (
    <div className="DebugButtons">
      <Button
        className="ContinueButton"
        variant="warning"
        onClick={continueCallback}
      >
        <FontAwesomeIcon icon={faEject} color="white" rotation={90} />
      </Button>
      <Button
        className="StepButton"
        variant="warning"
        onClick={stepCallback}
      >
        <FontAwesomeIcon icon={faShoePrints} color="white" />
      </Button>
    </div>
  );
};
