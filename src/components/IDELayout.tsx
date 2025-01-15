import React, { useEffect } from "react";
import classNames from "classnames";
import { useStoreActions, useStoreState } from "../store";
import { useJrEditState } from "./Junior/hooks";
import { EmptyProps } from "../utils";
import { DivSettingWindowTitle } from "./DivSettingWindowTitle";
import { ActivityBar } from "./Junior/ActivityBar";
import { ActivityContent } from "./Junior/ActivityContent";
import { EditorAndOutErr } from "./EditorAndOutErr";
import { StageAndActorsOrAssets } from "./StageAndActorsOrAssets";
import { FullScreenLayout } from "./FullScreenLayout";

export const IDELayout: React.FC<EmptyProps> = () => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const projectName = useStoreState(
    (state) => state.activeProject.project.name
  );
  const activityContentFullStateLabel = useJrEditState(
    (s) => s.activityContentFullStateLabel
  );
  const isFullScreen = useStoreState(
    (state) => state.ideLayout.fullScreenState.isFullScreen
  );
  const maybeConnectToLiveReloadServer = useStoreActions(
    (actions) => actions.reloadServer.maybeConnect
  );

  useEffect(() => maybeConnectToLiveReloadServer());

  if (isFullScreen) {
    return <FullScreenLayout />;
  }

  const classes = classNames(
    "IDELayout",
    "abs-0000",
    `activity-content-${activityContentFullStateLabel}`
  );

  return (
    <DivSettingWindowTitle
      className={classes}
      windowTitle={`Pytch: ${projectName}`}
      data-project-id={projectId}
    >
      <ActivityBar />
      <ActivityContent />
      <EditorAndOutErr />
      <StageAndActorsOrAssets />
    </DivSettingWindowTitle>
  );
};
