/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyProps } from "../utils";
import Card from 'react-bootstrap/Card';
import { useStoreState } from "../store";
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarthEurope } from '@fortawesome/free-solid-svg-icons';

declare let Sk: any;

function getImageSrc(actor: any) {
  if (!actor) {
    return "";
  }
  return actor.actor._appearances[actor.render_appearance_index].image.currentSrc;
}

function getActorVars(actor: any) {
  if (!actor) {
    return <div/>;
  }
  return <div>
    {Object.entries(Object.getPrototypeOf(actor.py_object))
    .filter(([key, value]) => !key.startsWith("_") && !String(value).startsWith("<function"))
    .map(([key, value]) => (
      <div key={key}>
      {key}: {String(value)}
      </div>
    ))}
  </div>
}

import { saveAs } from 'file-saver';

function saveObjectToFile(obj: any, filename: string) {
  const seen = new WeakSet();
  const blob = new Blob([JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  }, 2)], { type: 'application/json' });
  saveAs(blob, filename);
  console.log("saved to json")
}

export const DebugPane: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState((state) => state.activeProject.inDebugMode)
  const [highlightedCard, setHighlightedCard] = useState<string>("");
  const [localVars, setLocalVars] = useState<any>();
  const [globalVars, setGlobalVars] = useState<any>();

  useEffect(() => {
    const updateCards = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project.actors) {
      }
      if (project !== Sk.default_pytch_environment.current_live_project) {
        setLocalVars(project.get_all_local_variables());
        setGlobalVars(project.get_global_variables());
        const suspension = project.get_debug_suspension();
        if (suspension === null) {
          setHighlightedCard("");
        } 
        else {
          // saveObjectToFile(project, "project.json");
          setHighlightedCard(suspension.$tmps.self.$pytchActorInstance.info_label);
        }
      }
    };


    const intervalId = setInterval(updateCards, 100); // Update every 0.1s
    return () => clearInterval(intervalId);
  });

  if (!inDebugMode) {
    return <div>Debug mode is off. Please enable debug mode to see the details.</div>;
  }

  return (  
    <div className="DebugPane">
      <h2>Debug</h2>
      <div className="card-container">
        {globalVars && <Card>
          <Card.Body>
            <Card.Title>
              <FontAwesomeIcon icon={faEarthEurope} className="card-title-icon"/>
              Global Variables
            </Card.Title>
            <Card.Text className="monospace-font">
              {
                Object.entries(globalVars).map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))
              }
            </Card.Text>
          </Card.Body>
        </Card>}
        {localVars && Object.entries(localVars).map(([name, classVars]: [string, any]) => (
          <Card key={name} className={highlightedCard === name ? "highlighted-card" : ""}>
            <Card.Body>
              <Card.Title>
                <img src={classVars.img_src} className="card-title-img" />
                {name}
              </Card.Title>

              {/* Static variables for the class */}
              <Card.Text className="monospace-font">
                {Object.entries(classVars.static).map(([key, value], index) => (
                  <div key={`static-${index}`} style={{ color: 'blue' }}>
                    {`${key}: ${value}`}
                  </div>
                ))}
              </Card.Text>
              
              {/* Actor instances (clones) */}
              {Object.entries(classVars.actors).map(([actorId, actorVars]: [string, any]) => (
                <div key={actorId} className="actor-instance">
                  <hr />
                  <strong>Clone: {actorId}</strong>
                  <div>{actorVars.position.toString()}</div>
                  {actorVars.show_variables("local").map((variable: string, index: number) => (
                    <div key={`local-${actorId}-${index}`}>{variable}</div>
                  ))}
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}
      </div>
      {/* <div className="spacer"/> */}
    </div>
  );
};
