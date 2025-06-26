/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyProps } from "../utils";
import { useStoreState } from "../store";
import React, { useEffect, useState } from "react";
import {
  ActorClassCard,
  GlobalVariablesCard,
} from "./DebugCards"

declare let Sk: any;

export const DebugPane: React.FC<EmptyProps> = () => {
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
      <h5 style={{ padding: "1rem" }}>
        The variables of your sprites will show here while debugging.
      </h5>
    );
  }

  return (
    <div className="DebugPane">
      <h5 style={{ padding: "8px" }}>Shows your program’s variables and lets you step through its execution.</h5>
      <div className="card-container">
        <div>
          {globalVars && <GlobalVariablesCard globalVars={globalVars} />}
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
        </div>
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
