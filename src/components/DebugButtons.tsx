import Button from "react-bootstrap/Button";
import { useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Debugger } from "../skulpt-connection/drive-project";
import { focusStage } from "./StageControls";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

export const DebugButtons = () => {
  const setDebugLine = useStoreActions((actions) => actions.activeProject.setDebugLine);

  const continueCallback = () => {
    setDebugLine(-1);
    Debugger.disable_step_mode();
    Sk.pytch.current_live_project.continue_on_breakpoint();
    focusStage();
  }

  const stepCallback = () => {
    Debugger.enable_step_mode();
    Sk.pytch.current_live_project.pause_threads(false);
    focusStage();
  }

  return (
    <div className="DebugButtons">
      <Button
        className="DebugButton"
        onClick={continueCallback}
      >
        <FontAwesomeIcon icon="eject" color="white" rotation={90} />
      </Button>
      <Button
        className="DebugButton"
        onClick={stepCallback}
      >
        <FontAwesomeIcon icon="shoe-prints" color="white" />
      </Button>
    </div>
  );
};
