import React from "react";
import classNames from "classnames";
import { useLinkedJrTutorial } from "./hooks";
import { EmptyProps, failIfNull, range } from "../../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RawElement from "../../RawElement";
import { useStoreActions, useStoreState } from "../../../store";

type LabelledProgressNodeKind = "normal" | "inverse";
type ProgressNodeKind = "ellipsis" | LabelledProgressNodeKind;

type ProgressTrailNodeProps = { kind: ProgressNodeKind; label: string };
const ProgressTrailNode: React.FC<ProgressTrailNodeProps> = ({
  kind,
  label,
}) => {
  const nodeClasses = classNames("progress-node", kind);
  return (
    <div className={nodeClasses}>
      <span className="progress-node-label">{label}</span>
    </div>
  );
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
    <ProgressTrailNode
      key={idx}
      kind={nodeKindFromIndex(idx)}
      label={`${idx}`}
    />
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

const ProgressTrail_PerMethod: React.FC<EmptyProps> = () => {
  const linkedTutorial = useLinkedJrTutorial();
  const allowRandomChapterAccess = useStoreState(
    (state) => state.tutorialCollection.allowRandomChapterAccess
  );
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setLinkedLessonChapterIndex
  );

  const tutorialContent = linkedTutorial.content;
  const chapters = tutorialContent.chapters;

  // Only some of the chapters count as "progress stages".  (We might
  // exclude the "Challenges" and "Asset credits" chapters, for
  // example.)
  const progressStages = chapters.filter((chap) => chap.includeInProgressTrail);
  const nProgressStages = progressStages.length;

  const activeChapterIndex = linkedTutorial.interactionState.chapterIndex;

  function nodeKindFromIndex(idx: number) {
    const nTasksBeforeChapter = tutorialContent.nTasksBeforeChapter[idx];
    const nTasksInclChapter = tutorialContent.nTasksBeforeChapter[idx + 1];
    const nTasksDone = linkedTutorial.interactionState.nTasksDone;

    return nTasksDone >= nTasksInclChapter
      ? "completed"
      : nTasksDone >= nTasksBeforeChapter
      ? "current"
      : "future";
  }

  function cloneChapterTitleElt(idx: number) {
    return chapters[idx].titleElt.cloneNode(true) as HTMLElement;
  }

  function canJumpHereFromIndex(idx: number) {
    const nTasksBeforeChapter = tutorialContent.nTasksBeforeChapter[idx];
    const nTasksDone = linkedTutorial.interactionState.nTasksDone;
    return nTasksDone >= nTasksBeforeChapter || allowRandomChapterAccess;
  }

  const props: GenericProgressTrailProps = {
    nProgressStages,
    activeChapterIndex,
    setChapterIndex,
    nodeKindFromIndex,
    cloneChapterTitleElt,
    canJumpHereFromIndex,
  };

  return <GenericProgressTrail {...props} />;
};

const ProgressTrail_Flat: React.FC<EmptyProps> = () => {
  const maybeTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial
  );
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setActiveTutorialChapter
  );
  const tutorial = failIfNull(maybeTutorial, "no tutorial to construct ToC");

  const nProgressStages = tutorial.content.chapters.length;
  const activeChapterIndex = tutorial.activeChapterIndex;

  function nodeKindFromIndex(_idx: number): ProgressNodeKind {
    return "plain";
  }

  function cloneChapterTitleElt(idx: number) {
    // Hm; bit of a fudge:
    let h2Elt = document.createElement("h2");
    h2Elt.textContent = tutorial.content.chapters[idx].title;
    return h2Elt;
  }

  function canJumpHereFromIndex(_idx: number) {
    return true;
  }

  const props: GenericProgressTrailProps = {
    nProgressStages,
    activeChapterIndex,
    setChapterIndex,
    nodeKindFromIndex,
    cloneChapterTitleElt,
    canJumpHereFromIndex,
  };

  return <GenericProgressTrail {...props} />;
};

export const ProgressTrail = {
  PerMethod: ProgressTrail_PerMethod,
  Flat: ProgressTrail_Flat,
};
