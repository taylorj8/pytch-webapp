import React from "react";
import { EmptyProps } from "../../../utils";
import { Button } from "react-bootstrap";
import { useMappedLinkedJrTutorial } from "./hooks";
import { useStoreActions } from "../../../store";
import classNames from "classnames";
import {
  LinkedJrTutorial,
  allTasksDoneInCurrentChapter,
} from "../../../model/junior/jr-tutorial";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ChapterNavigationState = {
  allChapterTasksDone: boolean;
  chapterIdx: number;
  mNextChapterTitle: string | null;
  nChapters: number;
};

function mapTutorial(tutorial: LinkedJrTutorial): ChapterNavigationState {
  const allChapterTasksDone = allTasksDoneInCurrentChapter(tutorial);
  const chapterIdx = tutorial.interactionState.chapterIndex;
  const nChapters = tutorial.content.chapters.length;
  const mNextChapterTitle =
    chapterIdx === nChapters - 1
      ? null
      : tutorial.content.chapters[chapterIdx + 1].titleElt.innerText;
  return { allChapterTasksDone, chapterIdx, mNextChapterTitle, nChapters };
}

function eqState(
  s1: ChapterNavigationState,
  s2: ChapterNavigationState
): boolean {
  return (
    s1.allChapterTasksDone === s2.allChapterTasksDone &&
    s1.chapterIdx === s2.chapterIdx &&
    s1.mNextChapterTitle === s2.mNextChapterTitle &&
    s1.nChapters === s2.nChapters
  );
}

export const ChapterNavigation: React.FC<EmptyProps> = () => {
  const state = useMappedLinkedJrTutorial(mapTutorial, eqState);
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setLinkedLessonChapterIndex
  );

  if (!state.allChapterTasksDone) return null;

  const nextChapterTitle = state.mNextChapterTitle;
  if (nextChapterTitle == null) return null;

  const nextChapter = () => {
    setChapterIndex(state.chapterIdx + 1);
  };

  return (
    <div className="Junior-ChapterNavigation">
      <Button className="next" onClick={nextChapter}>
        Next: {nextChapterTitle}{" "}
        <FontAwesomeIcon className="next-arrow" icon="arrow-right-long" />
      </Button>
    </div>
  );
};
