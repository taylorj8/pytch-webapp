import Button from "react-bootstrap/Button";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Debugger } from "../skulpt-connection/drive-project";
import { faEject, faShoePrints } from '@fortawesome/free-solid-svg-icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

export const DebugButtons = () => {
  const setDebugState = useStoreActions((actions) => actions.activeProject.setDebugState)
  const setDebugLine = useStoreActions((actions) => actions.activeProject.setDebugLine)
  const displaySize = useStoreState((state) => state.ideLayout.stageDisplaySize)

  const continueCallback = () => {
    setDebugLine(-1)
    Debugger.disable_step_mode()
    setDebugState("debugging")
    Sk.pytch.current_live_project.continue_on_breakpoint()
  }

  const stepCallback = () => {
    Debugger.enable_step_mode()
    setDebugState("debugging")
    Sk.pytch.current_live_project.set_threads_paused(false);
  }

  const style = {
    right: `calc(${displaySize.width}px - 100px)`
  };

  return (
    <div className="DebugButtons" style={style}>
      <Button
        className="DebugButton"
        onClick={continueCallback}
      >
        <FontAwesomeIcon icon={faEject} color="white" rotation={90} />
      </Button>
      <Button
        className="DebugButton"
        onClick={stepCallback}
      >
        <FontAwesomeIcon icon={faShoePrints} color="white" />
      </Button>
    </div>
  );
};
