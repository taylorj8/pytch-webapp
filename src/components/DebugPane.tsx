/* eslint-disable @typescript-eslint/no-explicit-any */

// import { IAceEditorProps } from "react-ace";
import { EmptyProps } from "../utils";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useStoreActions, useStoreState } from "../store";
import { PytchProgramOps } from "../model/pytch-program";
import React from "react";

declare let Sk: any;

const getActors = () => {

  console.log("TEST")

  const project = Sk.pytch.current_live_project

  if (!project) {
    console.error("!!! No current live project found !!!");
    return [];
  }

  console.log(project.actors)

  // const actorNames = project.actors.map((actor: any) => actor.class_name());
  // return actorNames;
};

export const DebugPane: React.FC<EmptyProps> = () => {

  const code = useStoreState(
    (state) => PytchProgramOps.ensureKind("DebugPane", state.activeProject.project.program, "flat")
  );

  const debugState = useStoreState((state) => state.activeProject.debugState)
  const setDebugState = useStoreActions((actions) => actions.activeProject.setDebugState)

  const project = Sk.pytch.current_live_project
  // console.log("actors:")
  // console.log(realActors)

  return (
    <div className="DebugPane">
      <h1>Debug</h1>
      <div className="card-container">
        <div>
        <Button className="ContinueButton" variant="warning" onClick={
              () => {
                console.log("continue")
                project.continue_on_breakpoint()
              }
            }style={{ display: 'block', marginBottom: '10px', minWidth: '70px' }}>Continue</Button>
        <Button className="StepButton" variant="warning" onClick={
              () => {
                console.log("stepping")
                setDebugState("stepping")
              }
            }style={{ display: 'block', marginBottom: '10px', minWidth: '70px' }}>Step</Button>
        </div>
        {/* {showVars && realActors && realActors.map((realActor) => (
          <Card key={realActor.class_name}>
            <Card.Body>
              <Card.Title>{realActor.class_name}</Card.Title>
              {realActor.instances.map((instance: any, index: number) => (
                <Card key={index}>
                  <Card.Body>
                    <Card.Title>Instance {index + 1}</Card.Title>
                    {Object.keys(instance.py_object.$d.entries)
                      .filter((key) => !key.startsWith("!"))
                      .map((key) => (
                      <Button>{key}: {instance.js_attr(key)}</Button>
                      ))}
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        ))} */}

      </div>
    </div>
  );
};
