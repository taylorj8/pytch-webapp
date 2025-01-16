import React from "react";
import { EmptyProps } from "../../../utils";
import { useLinkedSpecimen } from "./hooks";
import { WidthMonitor } from "../WidthMonitor";

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
