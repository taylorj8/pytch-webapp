import React from "react";
import { EmptyProps } from "../../../utils";
import { useMappedLinkedJrTutorial } from "./hooks";
import { useStoreActions } from "../../../store";
import classNames from "classnames";
import {
  LinkedJrTutorial,
  allTasksDoneInCurrentChapter,
} from "../../../model/junior/jr-tutorial";
import {
  ChapterNavigationButtons,
  ChapterNavigationButtonsProps,
} from "./ChapterNavigationButtons";

type ChapterNavigationState = {
  allChapterTasksDone: boolean;
  chapterIdx: number;
  nChapters: number;
};

function mapTutorial(tutorial: LinkedJrTutorial): ChapterNavigationState {
  const allChapterTasksDone = allTasksDoneInCurrentChapter(tutorial);
  const chapterIdx = tutorial.interactionState.chapterIndex;
  const nChapters = tutorial.content.chapters.length;
  return { allChapterTasksDone, chapterIdx, nChapters };
}

function eqState(
  s1: ChapterNavigationState,
  s2: ChapterNavigationState
): boolean {
  return (
    s1.allChapterTasksDone === s2.allChapterTasksDone &&
    s1.chapterIdx === s2.chapterIdx &&
    s1.nChapters === s2.nChapters
  );
}

export const ChapterNavigation: React.FC<EmptyProps> = () => {
  const state = useMappedLinkedJrTutorial(mapTutorial, eqState);
  const setChapterIndex = useStoreActions(
    (actions) => actions.activeProject.setLinkedLessonChapterIndex
  );

  if (!state.allChapterTasksDone && !allowRandomChapterAccess) return null;

  let props: ChapterNavigationButtonsProps = {};
  if (state.mNextChapterTitle != null) {
    props.next = {
      displayTitle: state.mNextChapterTitle,
      navigate: () => setChapterIndex(state.chapterIdx + 1),
    };
  }

  return <ChapterNavigationButtons {...props} />;
};
