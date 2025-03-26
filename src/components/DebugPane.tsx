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
}

export const DebugPane: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState((state) => state.activeProject.inDebugMode)
  const [stage, setStage] = useState<any>();
  const [actors, setActors] = useState<any[]>([]);
  const [liveProject, setProject] = useState<any>();
  const [highlightedCard, setHighlightedCard] = useState<string>("");
  const [localVars, setLocalVars] = useState<any>();
  const [globalVars, setGlobalVars] = useState<any>();

  useEffect(() => {
    const updateCards = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project.actors) {
        setStage(project.actors[0].instances[0]); // todo: check if there is always only one stage
        setActors(project.actors[1].instances);
      }
      if (project !== Sk.default_pytch_environment.current_live_project) {
        setProject(project);
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
        {localVars && Object.entries(localVars).map(([name, vars]: [string, any]) => (
          <Card key={name} className={highlightedCard === name ? "highlighted-card" : ""}>
            <Card.Body>
              <Card.Title>
                <img src={vars.img_src} className="card-title-img" />
                {name}
              </Card.Title>
              <Card.Text className="monospace-font">
                {vars.position.toString()}
                {"\nCostume Index: " + vars.appearance_index}
                {vars.show_variables("static").map((variable: any, index: number) => (
                  <div key={index} style={{ color: 'blue' }}>{variable}</div>
                ))}
                {vars.show_variables("local").map((variable: any, index: number) => (
                    <div key={index}>{variable}</div>
                  ))}
              </Card.Text>
            </Card.Body>
          </Card>
        ))}
      </div>
      {/* <div className="spacer"/> */}
    </div>
  );
};
