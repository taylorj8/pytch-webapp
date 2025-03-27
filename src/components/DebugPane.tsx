/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyProps } from "../utils";
import Card from "react-bootstrap/Card";
import { useStoreState } from "../store";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarthEurope } from "@fortawesome/free-solid-svg-icons";
import { ListGroup, Button } from "react-bootstrap";
import { saveAs } from "file-saver";

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

interface ActorInstanceProps {
  actorId: string;
  actorVars: any;
  highlighted: boolean;
  isStage: boolean;
}

const ActorInstance: React.FC<ActorInstanceProps> = ({
  actorId,
  actorVars,
  highlighted,
  isStage,
}) => (
  <div className={`actor-instance ${highlighted ? "highlighted-clone" : ""}`}>
    <hr />
    <div className="clone-header">
      <img src={actorVars.img_src} className="card-title-img" />
      <strong className="ms-2">{actorId}</strong>
    </div>
    <div>{!isStage && actorVars.position?.toString()}</div>
    <div>{"Costume Number: " + actorVars.costume_number}</div>
    <ListGroup className="monospace-font mt-2">
      {actorVars
        .show_variables("local")
        .sort()
        .map((variable: string, index: number) => (
          <ListGroup.Item key={`local-${actorId}-${index}`}>
            {variable}
          </ListGroup.Item>
        ))}
    </ListGroup>
  </div>
);

const GlobalVariablesCard: React.FC<{ globalVars: any }> = ({ globalVars }) => (
  <Card>
    <Card.Body>
      <Card.Title>
        <FontAwesomeIcon icon={faEarthEurope} className="card-title-icon" />
        Global Variables
      </Card.Title>
      <Card.Text className="monospace-font">
        {Object.entries(globalVars)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
      </Card.Text>
    </Card.Body>
  </Card>
);

const ActorClassCard: React.FC<{
  name: string;
  classVars: any;
  highlighted: boolean;
  highlightedClone: string | null;
}> = ({ name, classVars, highlighted, highlightedClone }) => (
  <Card className={highlighted ? "highlighted-card" : ""}>
    <Card.Body>
      <Card.Title>{name}</Card.Title>

      {/* Static variables */}
      <Card.Text className="monospace-font">
        {Object.entries(classVars.static)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value], index) => (
            <div key={`static-${index}`} style={{ color: "blue" }}>
              {`${key}: ${value}`}
            </div>
          ))}
      </Card.Text>

      {/* Actor Instances */}
      {Object.entries(classVars.actors).map(
        ([actorId, actorVars]: [string, any]) => (
          <ActorInstance
            key={actorId}
            actorId={actorId}
            actorVars={actorVars}
            highlighted={highlightedClone === actorId}
            isStage={classVars.is_stage}
          />
        )
      )}
    </Card.Body>
  </Card>
);

export const DebugPane: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState(
    (state) => state.activeProject.inDebugMode
  );
  const [highlightedCard, setHighlightedCard] = useState<string>("");
  const [highlightedClone, setHighlightedClone] = useState<string | null>(
    null
  );
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
          setHighlightedClone(null);
        } else {
          setHighlightedCard(
            suspension.$tmps.self.$pytchActorInstance.info_label
          );
          const cloneId = suspension.$tmps.self.$pytchActorInstance.instance_id || null;
          setHighlightedClone(cloneId);
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
              highlighted={highlightedCard === name}
              highlightedClone={highlightedClone}
            />
          ))}
      </div>
    </div>
  );
};
