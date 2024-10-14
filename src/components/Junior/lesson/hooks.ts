import { useStoreState } from "../../../store";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";
import { LinkedContentKind } from "../../../model/linked-content";

const useHasLinkedContentOfKind = (tgtKind: LinkedContentKind): boolean =>
  useStoreState((state) => {
    const loadState = state.activeProject.linkedContentLoadingState;

    return (
      (loadState.kind === "succeeded" && loadState.content.kind === tgtKind) ||
      (loadState.kind === "pending" && loadState.contentRef.kind === tgtKind)
    );
  });

export const useHasLinkedLesson = () =>
  useHasLinkedContentOfKind("jr-tutorial");

export const useHasLinkedSpecimen = () => useHasLinkedContentOfKind("specimen");

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useMappedLinkedJrTutorial((tutorial) => tutorial);

export function useMappedLinkedJrTutorial<Result>(
  mapContent: (tutorial: LinkedJrTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;

    if (contentState.kind !== "succeeded")
      throw new Error("linked lesson has not been loaded");

    if (contentState.content.kind !== "jr-tutorial")
      throw new Error("linked lesson is not suitable");

    return mapContent(contentState.content);
  }, eqResult);
}
