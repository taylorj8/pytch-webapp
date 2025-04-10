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
        const suspension = project.get_debug_suspension();
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
      <div>
        Debug mode is off. Please enable debug mode to see the details.
      </div>
    );
  }

  return (
    <div className="DebugPane">
      <h2>Debug</h2>
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
            highlighted={highlightedCard === name}
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
              highlighted={highlightedCard === name} // todo fix highlighting for uncloned cards
              highlightedInstance={highlightedCard}
            />
          ))}
      </div>
    </div>
  );
};
