import { Tab } from "react-bootstrap";
import { EditMode } from "../model/ui";
import { useStoreActions } from "../store";

type DebugTabProps = {
  className: string | undefined;
  eventKey: string | undefined;
  title: string
	mode: EditMode;
}

export const DebugTab = (props: DebugTabProps) => {
	const setMode = useStoreActions(actions => actions.ideLayout.setEditMode)

	return (
		<Tab className={props.className} eventKey={props.eventKey} title={props.title} onSelect={
      () => {
          console.log("tab selected")
          setMode("debug");
        }
      }>
      <p className="info">Test12345</p>
		</Tab>
	)
}

// TODO implement
const Debug = () => {
  const inner =
      <p className="info-pane-placeholder">
        This will eventually show variables and other useful stuff.
      </p>
  return <div className="DebugPane">{inner}</div>;
};
