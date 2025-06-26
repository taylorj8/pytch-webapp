import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import React, { useEffect, useState } from "react";
import { ActorClassCard, GlobalVariablesCard } from "../DebugCards"

declare let Sk: any;

export const DebugSidebar: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState(
    (state) => state.activeProject.inDebugMode
  );
  const [highlightedCard, setHighlightedCard] = useState<string>("");
  const [localVars, setLocalVars] = useState<any>();
  const [globalVars, setGlobalVars] = useState<any>();

  useEffect(() => {
    const updateCards = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project !== Sk.default_pytch_environment.current_live_project) {
        setLocalVars(project.get_all_local_variables());
        setGlobalVars(project.get_global_variables());

        const suspendedThread = project.get_stepping_thread();
        const suspension = suspendedThread ? suspendedThread.skulpt_susp : null;

        if (suspension === null) {
          setHighlightedCard("");
        } else {
          setHighlightedCard(
            suspension.$tmps.self.$pytchActorInstance.info_label
          );
        }
      }
    };

    const intervalId = setInterval(updateCards, 100);
    return () => clearInterval(intervalId);
  }, []);

  if (!inDebugMode) {
    return (
      <h6 style={{ padding: "1.25rem" }}>
        The variables of your sprites will show here while debugging.
      </h6>
    );
  }

  return (
    <div className="DebugSidebar">
      <div className="card-container">
        {globalVars && Object.keys(globalVars).length > 0 && (
          <GlobalVariablesCard globalVars={globalVars} />
        )}
        {localVars && Object.entries(localVars)
          .filter(([_, classVars]) => (classVars as any).is_stage)
          .map(([name, classVars]) => (
            <ActorClassCard
              key={name}
              name={name}
              classVars={classVars}
              highlightedInstance={highlightedCard}
            />
          ))}
        {localVars &&
          Object.entries(localVars)
          .filter(([_, classVars]) => !(classVars as any).is_stage)
          .map(([name, classVars]: [string, any]) => (
            <ActorClassCard
              key={name}
              name={name}
              classVars={classVars}
              highlightedInstance={highlightedCard}
            />
          ))}
      </div>
    </div>
  );
};