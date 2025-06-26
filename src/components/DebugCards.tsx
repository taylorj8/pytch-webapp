/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEarthEurope } from "@fortawesome/free-solid-svg-icons";
import Collapse from "react-bootstrap/Collapse";


type Variable = { key: string; val: any; type: string };

interface VariableListProps {
  variables: Variable[];
  actorId: string;
  prefix?: string; // Optional, for unique keys if needed
}


export const VariableList: React.FC<VariableListProps> = ({ variables, actorId, prefix = "local" }) => {
  const [expandedStrings, setExpandedStrings] = useState<Record<string, boolean>>({});

  const toggleString = (key: string) => {
    setExpandedStrings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="monospace-font">
      {variables.map((variable, index) => {
        const key = `${prefix}-${actorId}-${variable.key}`;
        const valueStr = String(variable.val);

        return (
          <div key={key}>
            <span style={{ fontWeight: "bold", color: "black" }}>{variable.key}: </span>

            {variable.type === "string" ? (() => {
              const isExpanded = expandedStrings[key] ?? false;
              const shouldTruncate = valueStr.length > 25;
              const displayStr = shouldTruncate && !isExpanded
                ? valueStr.slice(0, 22) + "[…]"
                : valueStr;

              return (
                <span
                  style={{ color: "green", cursor: shouldTruncate ? "pointer" : "default" }}
                  onClick={() => shouldTruncate && toggleString(key)}
                  title={shouldTruncate ? "Click to expand/collapse" : undefined}
                >
                  "{displayStr}"
                </span>
              );
            })() : variable.type === "number" ? (
              <span style={{ color: "blue" }}>{Number(variable.val).toFixed(3)}</span>
            ) : (
              <span>{valueStr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};


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
          Costume Index: {actorVars.costume_index}
        </div>
  
        <hr className="my-2" />
  
        <VariableList variables={actorVars.display_variables("local")} actorId={actorId} />
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
      <div className="monospace-font">
        {Object.entries(globalVars)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
      </div>
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

      <div className="monospace-font">{classVars.display_costumes()}</div>
      <div className="monospace-font">
        {classVars.is_stage
          ? `Backdrop Index: ${actorVars.costume_index}`
          : `Costume Index: ${actorVars.costume_index}`}
      </div>
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

        {actorVars.has_variables("local") && <hr className="my-2" />}

        {/* Local variables */}
        <VariableList variables={actorVars.display_variables("local")} actorId={actorId} />
      </div>
    </Card.Body>
  </Card>
);

export const ActorClassCard: React.FC<{
  name: string;
  classVars: any;
  highlightedInstance: string;
}> = ({ name, classVars, highlightedInstance }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const actorEntries = Object.entries(classVars.actors);

  if (!classVars.has_clones()) {
    const [actorId, actorVars] = actorEntries[0];
    return (
      <UnclonedActorCard
        name={name}
        classVars={classVars}
        actorId={actorId}
        actorVars={actorVars}
        highlighted={name === highlightedInstance.split("-")[0]}
      />
    );
  }

  return (
    <Card>
      <Card.Body>
      <Card.Title className="d-flex justify-content-between align-items-center">
        {name}
        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.7em", cursor: "pointer" }} onClick={() => setIsExpanded(!isExpanded)}>
            {actorEntries.length} instances   {isExpanded ? "▲" : "▼"}
        </span>
      </Card.Title>

        {/* Static variables */}
        <div className="monospace-font">{classVars.display_costumes()}</div>
        <div className="monospace-font">
          {Object.entries(classVars.static)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value], index) => (
              <div key={`static-${index}`} style={{ color: "blue" }}>
                {`${key}: ${value}`}
              </div>
            ))}
        </div>

        {/* Cloned actor instances */}
        <Collapse in={isExpanded}>
          <div className="clone-container">
            {actorEntries.map(([actorId, actorVars]: [string, any]) => (
              <ActorInstance
                key={actorId}
                actorId={actorId}
                actorVars={actorVars}
                highlighted={actorId === highlightedInstance}
                isStage={classVars.is_stage}
              />
            ))}
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};
