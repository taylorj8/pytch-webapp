/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyProps } from "../utils";
import Card from "react-bootstrap/Card";
import { useStoreState } from "../store";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarthEurope } from "@fortawesome/free-solid-svg-icons";
import { ListGroup, Button } from "react-bootstrap";
import { saveAs } from "file-saver";
import {
  ActorClassCard,
  GlobalVariablesCard,
} from "./DebugCards"

declare let Sk: any;

function saveObjectToFile(obj: any, filename: string) {
  const seen = new WeakSet();
  const blob = new Blob(
    [
      JSON.stringify(
        obj,
        (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return;
            }
            seen.add(value);
          }
          return value;
        },
        2
      ),
    ],
    { type: "application/json" }
  );
  saveAs(blob, filename);
  console.log("saved to json");
}


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
        {globalVars && <GlobalVariablesCard globalVars={globalVars} />}
        {localVars &&
          Object.entries(localVars).map(([name, classVars]: [string, any]) => (
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
