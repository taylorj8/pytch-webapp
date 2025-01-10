import React from "react";
import { useStoreState } from "../store";
import { EmptyProps, assertNever } from "../utils";
import { StageWithControls } from "./StageWithControls";
import { ActorsList } from "./Junior/ActorsList";

const ActorsOrAssets: React.FC<EmptyProps> = () => {
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  switch (programKind) {
    case "flat":
      return <div>TODO: Assets for "flat" program.</div>;
    case "per-method":
      return <ActorsList />;
    default:
      return assertNever(programKind);
  }
};

export const StageAndActorsOrAssets: React.FC<EmptyProps> = () => {
  return (
    <div className="StageAndActorsOrAssets">
      <StageWithControls />
      <ActorsOrAssets />
    </div>
  );
};
