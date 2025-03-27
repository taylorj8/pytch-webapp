/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Card from "react-bootstrap/Card";
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
    <Card className={`mb-2 ms-0 me-0 ${highlighted ? "highlighted-card" : "inner-card"}`}>
      <Card.Body>
        <Card.Title className="d-flex align-items-center">
          <img src={actorVars.img_src} className="card-title-img me-2" />
          <strong>{actorId}</strong>
        </Card.Title>
  
        {!isStage && (
          <div className="monospace-font mb-1">
            {actorVars.position?.toString()}
          </div>
        )}
        <div className="monospace-font mb-2">
          Costume Number: {actorVars.costume_number}
        </div>
  
        <hr className="my-2" />
  
        <div className="monospace-font">
          {actorVars
            .show_variables("local")
            .sort()
            .map((variable: string, index: number) => (
              <div key={`local-${actorId}-${index}`}>{variable}</div>
            ))}
        </div>
      </Card.Body>
    </Card>
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
  highlighted: boolean;
}> = ({ name, classVars, actorId, actorVars, highlighted }) => (
  <Card className={`mb-2 ms-0 me-0 ${highlighted ? "highlighted-card" : ""}`}>
    <Card.Body>
      <Card.Title className="d-flex align-items-center">
        <img src={actorVars.img_src} className="card-title-img me-2" />
        {name}
      </Card.Title>

      <div>
      {!classVars.is_stage && (
        <div className="mt-3 monospace-font">
          {actorVars.position?.toString()}
        </div>
      )}

      <div className="monospace-font">Costume Number: {actorVars.costume_number}</div>
        {/* Static variables */}
        <div className="monospace-font flex-fill">
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
          {actorVars
            .show_variables("local")
            .sort()
            .map((variable: string, index: number) => (
              <div key={`local-${actorId}-${index}`}>{variable}</div>
            ))}
        </div>
      </div>
    </Card.Body>
  </Card>
);

export const ActorClassCard: React.FC<{
  name: string;
  classVars: any;
  highlighted: boolean;
  highlightedInstance: string;
}> = ({ name, classVars, highlighted, highlightedInstance: highlightedClone }) => {
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
        highlighted={highlighted}
      />
    );
  }

  return (
    <Card className={highlighted ? "highlighted-card" : ""}>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-center">
            {name}
            <span className="badge bg-secondary" style={{ fontSize: "0.7em" }}>
                {actorEntries.length} instances
            </span>
        </Card.Title>

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
        <div className="clone-container">
          {actorEntries.map(([actorId, actorVars]: [string, any]) => (
            <ActorInstance
              key={actorId}
              actorId={actorId}
              actorVars={actorVars}
              highlighted={highlightedClone === actorId}
              isStage={classVars.is_stage}
            />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};
