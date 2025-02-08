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

export const DebugPane: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState((state) => state.activeProject.inDebugMode)
  const [stage, setStage] = useState<any>();
  const [actors, setActors] = useState<any[]>([]);
  const [liveProject, setProject] = useState<any>();

  useEffect(() => {
    const updateActors = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project.actors) {
        setStage(project.actors[0].instances[0]); // todo: check if there is always only one stage
        setActors(project.actors[1].instances);
      }
      if (project !== Sk.default_pytch_environment.current_live_project) {
        setProject(project);
      }
    };

    const intervalId = setInterval(updateActors, 100); // Update every 0.1s
    return () => clearInterval(intervalId);
  });

  if (!inDebugMode) {
    return <div>Debug mode is off. Please enable debug mode to see the details.</div>;
  }

  return (  
    <div className="DebugPane">
      <h2>Debug</h2>
      <div className="card-container">
        {liveProject && <Card>
          <Card.Body>
            <Card.Title>
              <FontAwesomeIcon icon={faEarthEurope} className="card-title-icon"/>
              Global Variables
            </Card.Title>
            <Card.Text>
                {Object.entries(liveProject.$containingModule.$d)
                .filter(([key, value]) => !key.startsWith("_") && !key.startsWith("$") && typeof value !== "function" && !String(value).startsWith("<module"))
                .map(([key, value]) => (
                  <div key={key}>
                  {key}: {String(value)}
                  </div>
                ))}
            </Card.Text>
          </Card.Body>
        </Card>}
        {stage && <Card>
          <Card.Body>
            <Card.Title>
              <img src={getImageSrc(stage)} className="card-title-img" />
              {stage.info_label}
            </Card.Title>
            <Card.Text>
              {getActorVars(stage)}
            </Card.Text>
          </Card.Body>
        </Card>}
        {actors.map((actor: any) => (
          <Card key={actor.info_label}>
            <Card.Body>
              <Card.Title>
                <img src={getImageSrc(actor)} className="card-title-img" />
                {actor.info_label}
              </Card.Title>
              <Card.Text>
                <div>Position: {parseFloat(actor.render_x.toFixed(3))}, {parseFloat(actor.render_y.toFixed(3))}</div>
                {getActorVars(actor)}
              </Card.Text>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};
