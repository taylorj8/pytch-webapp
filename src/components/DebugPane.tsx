/* eslint-disable @typescript-eslint/no-explicit-any */

// import { IAceEditorProps } from "react-ace";
import { EmptyProps } from "../utils";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { useStoreActions, useStoreState } from "../store";
import { PytchProgramOps } from "../model/pytch-program";
import React, { useEffect } from "react";

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


const extractNames = (text: string) => {
  const separatorRegex = /(class\s)[\s\S]*?(?=class|$)/g;
  const classRegex = /class (\w+)/;
  const actors: { actor: string; scripts: string[] }[] = [];
  const scriptRegex = /@pytch\..*\n\s*def\s+(\w+)/g

  let wholeClass;
  while ((wholeClass = separatorRegex.exec(text)) !== null) {
    const className = classRegex.exec(wholeClass[0])
    const scripts: string[] = [];
    let scriptMatch;

    scriptRegex.lastIndex = 0;
    while ((scriptMatch = scriptRegex.exec(wholeClass[0])) !== null) {
      scripts.push(scriptMatch[1]);
    }

    if (className && scripts.length > 0) {
      actors.push({ actor: className[1], scripts: scripts });
    }
  }

  return actors;
}

export const DebugPane: React.FC<EmptyProps> = () => {

  const code = useStoreState(
    (state) => PytchProgramOps.ensureKind("DebugPane", state.activeProject.project.program, "flat")
  );

  const setRunState = useStoreActions((actions) => actions.activeProject.setRunState)

  const actors = extractNames(code.text)
  if (!actors) {
    return <div></div>
  }

  const [buttonName, setButtonName] = React.useState<"Pause" | "Play">("Pause");
  const [showVars, setShowVars] = React.useState<boolean>(false);

  const realActors: any[] = Sk.pytch.current_live_project.actors
  console.log("actors:")
  console.log(realActors)

  return (
    <div className="DebugPane">
      <h1>Choose a script to debug</h1>
      <div className="card-container">
        {actors.map(({ actor, scripts }) => (
          <Card>
            <Card.Body>
              <Card.Title>{actor}</Card.Title>
              {scripts.map((script, i) => (
                <Button key={`${actor}Button${i}`} className="DebugScriptButton">{script}</Button>
              ))}
            </Card.Body>
          </Card>
        ))}
        <div>
            <Button className="PlayPauseButton" variant="warning" onClick={
            () => {
              const project = Sk.pytch.current_live_project;
              if (project === Sk.default_pytch_environment.current_live_project) {
                console.log("no real live project; bailing");
                return;
              }

              if (buttonName === "Pause") {
                setRunState("pause")
                setButtonName("Play")
                setShowVars(true)
              } else {
                setRunState("run")
                setButtonName("Pause")
                setShowVars(false)
              }
            }
            } style={{ display: 'block', marginBottom: '10px', minWidth: '70px' }}>{buttonName}</Button>
            {buttonName === "Play" && (
            <Button className="StepButton" variant="warning" onClick={
              () => {
              const project = Sk.pytch.current_live_project;
              if (project === Sk.default_pytch_environment.current_live_project) {
                console.log("no real live project; bailing");
                return;
              }
              Sk.pytch.sound_manager.one_frame();
              const projectState = project.one_frame();
              
              // setRunState("step")
              }
            } style={{ display: 'block', marginBottom: '10px', minWidth: '70px' }}>Step</Button>
            )}
        </div>
        {/* {showVars && realActors && realActors.map((realActor) => (
          <Card key={realActor.class_name}>
            <Card.Body>
              <Card.Title>{realActor.class_name}</Card.Title>
              <Button className="DebugScriptButton">
                {(() => {
                  try {
                    console.log(realActor)
                    return realActor.instances[0].js_attr("y_position");
                  } catch (e) {
                    console.error(e);
                    return "Error";
                  }
                })()}
              </Button>
            </Card.Body>
          </Card>
        ))} */}
        {showVars && realActors && realActors.map((realActor) => (
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
        ))}

      </div>
    </div>
  );
};
