import React from "react";
import classNames from "classnames";
import { useLinkedJrTutorial } from "./hooks";
import { EmptyProps, range } from "../../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RawElement from "../../RawElement";
import { useStoreActions, useStoreState } from "../../../store";

type ProgressNodeKind = "completed" | "current" | "future";

type ProgressTrailNodeProps = { kind: ProgressNodeKind };
const ProgressTrailNode: React.FC<ProgressTrailNodeProps> = ({ kind }) => {
  const nodeClasses = classNames("progress-node", kind);
  const objContent =
    kind === "completed" ? (
      <span>
        <FontAwesomeIcon icon="check"></FontAwesomeIcon>
      </span>
    ) : kind === "future" ? (
      <div className="future-node" />
    ) : null;

  return <div className={nodeClasses}>{objContent}</div>;
};

type GenericProgressTrailProps = {
  nProgressStages: number;
  activeChapterIndex: number;
  setChapterIndex(idx: number): void;
  nodeKindFromIndex(idx: number): ProgressNodeKind;
  cloneChapterTitleElt(idx: number): HTMLElement;
  canJumpHereFromIndex(idx: number): boolean;
};
const GenericProgressTrail: React.FC<GenericProgressTrailProps> = ({
  nProgressStages,
  activeChapterIndex,
  setChapterIndex,
  nodeKindFromIndex,
  cloneChapterTitleElt,
  canJumpHereFromIndex,
}) => {
  const chapterTitleElt = cloneChapterTitleElt(activeChapterIndex);

  const nodeDivs = range(nProgressStages).map((idx) => (
    <ProgressTrailNode key={idx} kind={nodeKindFromIndex(idx)} />
  ));

  const maybeChapterNumberLabel = activeChapterIndex > 0 && (
    <span className="chapter-number">{activeChapterIndex} —</span>
  );

  const nodeBackgrounds = range(nProgressStages).map((idx) => {
    const isActive = idx === activeChapterIndex;
    const classes = classNames("progress-node-background", { isActive });
    return <div key={idx} className={classes} />;
  });

  const nodeHoverTargets = range(nProgressStages).map((idx) => {
    const canJumpHere = canJumpHereFromIndex(idx);
    const contentElt = cloneChapterTitleElt(idx);

    const tooltip = (
      <div className="progress-node-tooltip">
        {!canJumpHere && <FontAwesomeIcon className="locked" icon="lock" />}
        <RawElement element={contentElt} />
      </div>
    );

    const onClick = canJumpHere ? () => setChapterIndex(idx) : () => void 0;
    const classes = classNames("progress-node-hover-target", { canJumpHere });

    return (
      <div
        key={idx}
        data-chapter-index={`${idx}`}
        className={classes}
        onClick={onClick}
      >
        {tooltip}
      </div>
    );
  });

  return (
    <>
      <div className="ProgressTrail">
        <div className="node-backgrounds">{nodeBackgrounds}</div>
        <div className="track" />
        <div className="nodes">{nodeDivs}</div>
        <div className="node-hover-targets">{nodeHoverTargets}</div>
      </div>
      <div className="chapter-title">
        {maybeChapterNumberLabel}
        {chapterTitleElt.innerText}
      </div>
    </>
  );
};
