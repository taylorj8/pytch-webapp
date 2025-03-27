/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarthEurope } from "@fortawesome/free-solid-svg-icons";

interface ActorInstanceProps {
  actorId: string;
  actorVars: any;
  highlighted: boolean;
  isStage: boolean;
}

export const ActorInstance: React.FC<ActorInstanceProps> = ({
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

export const GlobalVariablesCard: React.FC<{ globalVars: any }> = ({ globalVars }) => (
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

export const UnclonedActorCard: React.FC<{
  name: string;
  classVars: any;
  actorId: string;
  actorVars: any;
}> = ({ name, classVars, actorId, actorVars }) => (
  <Card>
    <Card.Body>
      <Card.Title className="d-flex align-items-center">
        <img src={actorVars.img_src} className="card-title-img me-2" />
        {name}
      </Card.Title>

      <div className="d-flex flex-row justify-content-between gap-4 mt-2 flex-wrap">
        {/* Static variables */}
        <div className="monospace-font flex-fill">
          <h6>Static Variables</h6>
          {Object.entries(classVars.static)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value], index) => (
              <div key={`static-${index}`} style={{ color: "blue" }}>
                {`${key}: ${value}`}
              </div>
            ))}
        </div>

        {/* Local variables */}
        <div className="monospace-font flex-fill">
          <h6>Local Variables</h6>
          {actorVars
            .show_variables("local")
            .sort()
            .map((variable: string, index: number) => (
              <div key={`local-${actorId}-${index}`}>{variable}</div>
            ))}
        </div>
      </div>

      {!classVars.is_stage && (
        <div className="mt-3 monospace-font">
          {actorVars.position?.toString()}
        </div>
      )}
      <div className="monospace-font">Costume Number: {actorVars.costume_number}</div>
    </Card.Body>
  </Card>
);

export const ActorClassCard: React.FC<{
  name: string;
  classVars: any;
  highlighted: boolean;
  highlightedClone: string | null;
}> = ({ name, classVars, highlighted, highlightedClone }) => {
  const hasClones = classVars.has_clones();
  const actorEntries = Object.entries(classVars.actors);

  if (!hasClones && actorEntries.length === 1) {
    const [actorId, actorVars] = actorEntries[0];
    return (
      <UnclonedActorCard
        name={name}
        classVars={classVars}
        actorId={actorId}
        actorVars={actorVars}
      />
    );
  }

  return (
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

        {/* Cloned actor instances */}
        {actorEntries.map(([actorId, actorVars]: [string, any]) => (
          <ActorInstance
            key={actorId}
            actorId={actorId}
            actorVars={actorVars}
            highlighted={highlightedClone === actorId}
            isStage={classVars.is_stage}
          />
        ))}
      </Card.Body>
    </Card>
  );
};
