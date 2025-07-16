import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import React, { useEffect, useState } from "react";
import { ActorClassCard, GlobalVariablesCard } from "../DebugCards"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

declare let Sk: any;

export const DebugSidebar: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState(
    (state) => state.activeProject.inDebugMode
  );
  const [highlightedCard, setHighlightedCard] = useState<string>("");
  const [classVars, setClassVars] = useState<any>();
  const [globalVars, setGlobalVars] = useState<any>();

  useEffect(() => {
    const updateCards = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project !== Sk.default_pytch_environment.current_live_project) {
        setClassVars(project.extract_class_variables());
        setGlobalVars(project.extract_global_variables());

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

    const intervalId = setInterval(updateCards, 100); // todo change so only updates when needed
    return () => clearInterval(intervalId);
  }, []);

  if (!inDebugMode) {
    return <div style={{ padding: "1.5rem", height: "100%"}}>
      <h4>Debug Panel</h4>
      <h6>
        Click the yellow debug button above the stage to start the program in <em>Debug Mode</em>.
        <br/><br/>While debugging your program's variables will show here.
      </h6>
      <div className="emptyDebugSidebarIcon">
        <FontAwesomeIcon icon="bug" size="10x" style={{ opacity: 0.075 }} />
      </div>
    </div>
      
  }

  return (
    <div className="DebugSidebar">
      <div className="card-container">
        {globalVars && Object.keys(globalVars).length > 0 && (
          <GlobalVariablesCard globalVars={globalVars} />
        )}
        {classVars && Object.entries(classVars)
          .filter(([_, classVars]) => (classVars as any).is_stage)
          .map(([name, classVars]) => (
            <ActorClassCard
              key={name}
              name={name}
              classVars={classVars}
              highlightedInstance={highlightedCard}
            />
          ))}
        {classVars &&
          Object.entries(classVars)
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