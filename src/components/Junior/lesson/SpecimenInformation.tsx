import React from "react";
import { assertNever, EmptyProps } from "../../../utils";
import { useLinkedSpecimen } from "./hooks";
import { WidthMonitor } from "../WidthMonitor";
import { Button } from "react-bootstrap";
import { LinkedSpecimen } from "../../../model/linked-content";
import { useStoreState } from "../../../store";
import { codeTextEnsuringFlat } from "../../hooks/code-text";
import { useRunFlow } from "../../../model";

type ActionButtonsProps = { specimen: LinkedSpecimen };
const ActionButtons: React.FC<ActionButtonsProps> = ({ specimen }) => {
  const runFlow = useRunFlow((f) => f.viewCodeDiffFlow);
  const program = useStoreState((state) => state.activeProject.project.program);
  const specimenKind = specimen.lesson.project.program.kind;
  switch (specimenKind) {
    case "flat": {
      const originalCodeText = specimen.lesson.project.program.text;
      const currentCodeText = codeTextEnsuringFlat("<ActionButtons>", program);
      const launch = () => {
        runFlow({
          textA: originalCodeText,
          textB: currentCodeText,
        });
      };
      return <Button onClick={launch}>Compare to original</Button>;
    }
    case "per-method":
      return false;
    default:
      return assertNever(specimenKind);
  }
};

export const SpecimenInformation: React.FC<EmptyProps> = () => {
  const specimen = useLinkedSpecimen();
  const specimenName = specimen.lesson.project.name;

  return (
    <div className="Junior-LessonContent-container">
      <WidthMonitor nonStageWd={980} />
      <div className="Junior-LessonContent-HeaderBar">
        <div className="specimen-name">{specimenName}</div>
      </div>

      <div className="Junior-LessonContent-inner-container">
        <div className="Junior-LessonContent abs-0000-oflow">
          <div className="content">
            <p>
              This project is based on the code for <em>{specimenName}</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
