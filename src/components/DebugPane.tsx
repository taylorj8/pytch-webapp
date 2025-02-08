/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyProps } from "../utils";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useStoreActions, useStoreState } from "../store";
import React, { useEffect, useState } from "react";
import { Debugger } from "../skulpt-connection/drive-project";

declare let Sk: any;

export const DebugPane: React.FC<EmptyProps> = () => {
  const inDebugMode = useStoreState((state) => state.activeProject.inDebugMode)
  const [actors, setActors] = useState<any[]>([]);

  useEffect(() => {
    const updateActors = () => {
      const project = Sk.pytch.current_live_project;
      if (project && project.actors) {
        setActors(project.actors[1].instances);
      }
    };

    const intervalId = setInterval(updateActors, 100); // Update every 0.1s
    return () => clearInterval(intervalId);
  });

  if (!inDebugMode) {
    return <div>Debug mode is off. Please enable debug mode to see the details.</div>;
  }
  // const stage = project.actors[0].instances[0]
  // const actors = project.actors[1].instances

  // console.log(actors[0].info_label)

  return (  
    <div className="DebugPane">
      <h1>Debug</h1>
      <div className="card-container">
        <Card>
          <Card.Body>
            <Card.Title>Stage</Card.Title>
            <Card.Text>
              <div>Costume: </div>
            </Card.Text>
          </Card.Body>
        </Card>
        {actors.map((actor: any) => (
          <Card key={actor.info_label}>
            <Card.Body>
              <Card.Title>{actor.info_label}</Card.Title>
              <Card.Text>
                <div>Position: {parseFloat(actor.render_x.toFixed(3))}, {parseFloat(actor.render_y.toFixed(3))}</div>
                <div>Costume: </div>
              </Card.Text>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};
