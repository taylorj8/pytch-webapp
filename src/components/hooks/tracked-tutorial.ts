import { ITrackedTutorial } from "../../model/project-core";
import { useStoreState } from "../../store";

export function useMappedTrackedTutorial<Result>(
  mapTutorial: (tutorial: ITrackedTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const project = state.activeProject.project;
    const mTrackedTutorial = project.trackedTutorial;
    if (mTrackedTutorial == null)
      throw new Error(`project ${project.id} is not tracking a tutorial`);

    return mapTutorial(mTrackedTutorial);
  }, eqResult);
}
