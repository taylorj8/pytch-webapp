import React from "react";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import RawElement from "../RawElement";
import { asyncFlowModal } from "../async-flow-modals/utils";
import { settleFunctions } from "../../model/user-interactions/async-user-flow";
import { useFlowState } from "../../model";

export const CodeDiffHelpModal = () => {
  const { fsmState, isSubmittable } = useFlowState((f) => f.codeDiffHelpFlow);

  return asyncFlowModal(fsmState, (activeState) => {
    const { samples } = activeState.runState;
    const settle = settleFunctions(isSubmittable, activeState);
    return (
      <Modal
        show={true}
        onHide={settle.cancel}
        animation={false}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>What changes should I make to my code?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {samples.unchanged && (
            <Alert variant="secondary">
              <RawElement
                className="patch-container"
                element={samples.unchanged}
              />
              <p>
                Lines like this{" "}
                <strong>
                  help you find the part of your code which needs changing
                </strong>
                . The number (to the left of the vertical divider) shows you
                which line it is, in the code as it is now.
              </p>
            </Alert>
          )}
          {samples.deleted && (
            <Alert variant="secondary">
              <RawElement
                className="patch-container"
                element={samples.deleted}
              />
              <p>
                Lines like this show you{" "}
                <strong>code you need to delete</strong>.
              </p>
            </Alert>
          )}
          {samples.added && (
            <Alert variant="secondary">
              <RawElement className="patch-container" element={samples.added} />
              <p>
                Lines like this show you <strong>code you need to add</strong>.
                You can click on the <span className="add-code-icon">+</span>{" "}
                button to copy the lines of code ready for pasting.
              </p>
            </Alert>
          )}
          <p>
            Faint “<code>···</code>” at the start of a line show spaces — type
            these as normal space characters.
          </p>
        </Modal.Body>
      </Modal>
    );
  });
};
