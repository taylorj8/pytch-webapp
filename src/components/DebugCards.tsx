/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapse from "react-bootstrap/Collapse";

const maxStringWidth = 35;

type Variable = { key: string; val: any; };

interface FormattedValueProps {
  k: string;
  value: any;
  maxStringWidth: number;
}

const FormattedValue: React.FC<FormattedValueProps> = ({
  k,
  value,
  maxStringWidth
}) => {
  const [expandedStrings, setExpandedStrings] = useState<Record<string, boolean>>({});
  const toggle = () =>
    setExpandedStrings((prev) => ({ ...prev, [k]: !prev[k] }));

  const isExpanded = expandedStrings[k] ?? false;
  const type = Array.isArray(value) ? "array" : typeof value;

  if (type === "string") {
    const shouldTruncate = value.length + k.length > maxStringWidth;
    const displayStr =
      shouldTruncate && !isExpanded
        ? value.slice(0, maxStringWidth - k.length - 3) + "[…]"
        : value;

    return (
      <span
        style={{ color: "green", cursor: shouldTruncate ? "pointer" : "default" }}
        onClick={shouldTruncate ? toggle : undefined}
        title={!shouldTruncate ? "string" : isExpanded ? "Click to collapse string" : "Click to expand string"}
      >
        "{displayStr}"
      </span>
    );
  }

  if (type === "number") {
    const num = Number(value);
    const display = Number.isInteger(num) ? num : num.toFixed(3);
    return <span 
      style={{ color: "blue", cursor: "default"}} 
      title="number">{display}
    </span>;
  }

  if (type === "boolean") {
    return <span 
      style={{ color: "darkorange", cursor: "default"}} 
      title="boolean">{value ? "True" : "False"}
    </span>;
  }

  if (type === "array") {
    const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down";
    return (
      <span>
        <span
          style={{ color: "purple", cursor: "pointer" }}
          title="array"
          onClick={toggle}
        >
          [Array({value.length})]
          <FontAwesomeIcon icon={collapseOrExpandIcon} className="collapse-or-expand-icon" />
        </span>
        <Collapse in={isExpanded}>
          <div style={{ paddingLeft: "1rem" }}>
            {value.map((elem: any, idx: number) => (
              <div key={`${k}-${idx}`}>
                <span className="variable-name">{idx}: </span>
                <FormattedValue
                  k={idx.toString()}
                  value={elem && typeof elem === "object" && "v" in elem ? elem.v : elem}
                  maxStringWidth={maxStringWidth - 2}
                />
              </div>
            ))}
          </div>
        </Collapse>
      </span>
    );
  }

  if (type === "object" && value !== null) {
    const keys = Object.keys(value);
    const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down";
    return (
      <div>
        <span
          style={{ color: "brown", cursor: "pointer" }}
          title="object"
          onClick={toggle}
        >
          {"{"}Object({keys.length})
          <FontAwesomeIcon icon={collapseOrExpandIcon} className="collapse-or-expand-icon" />
        </span>
        <Collapse in={isExpanded}>
          <div style={{ paddingLeft: "1rem" }}>
            {keys.map((k) => (
              <div key={k}>
                <FormattedValue
                  k={k}
                  value={value[k].v}
                  maxStringWidth={maxStringWidth - 2}
                />
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

interface VariableListProps {
  variables: Variable[];
}

const VariableList: React.FC<VariableListProps> = ({variables}) => {
  return (
    <div className="monospace-font">
      {variables.map((variable, index) => {
        return (
          <div key={variable.key}>
            <span className="variable-name">{variable.key}: </span>
            <FormattedValue
              k={variable.key}
              value={variable.val}
              maxStringWidth={maxStringWidth}
            />
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
    <Card className={`mt-2 mb-0 ms-0 me-0 ${highlighted ? "highlighted-card" : "inner-card"}`}>
      <Card.Body>
        <Card.Title className="d-flex align-items-center">
          <img src={actorVars.img_src} className="card-title-img me-2" />
          <strong>{actorId}</strong>
        </Card.Title>
  
        <div className="monospace-font mb-1">
          <span className="variable-name">Current Costume: </span><span style={{ color: "blue" }}>{actorVars.costume_index}</span>
        </div>
        {!isStage && (
          <div className="monospace-font mb-2">
             <span className="variable-name">Position: </span>{actorVars.position.toString()}
          </div>
        )}
  
        {actorVars.has_variables("local") && <hr className="my-2" />}
        <VariableList variables={actorVars.display_variables("local")} />
      </Card.Body>
    </Card>
  );
  

export const GlobalVariablesCard: React.FC<{ globalVars: any }> = ({ globalVars }) => (
  <Card>
    <Card.Body>
      <Card.Title>
        <FontAwesomeIcon icon="earth-europe" className="card-title-icon" />
        Global Variables
      </Card.Title>
      <div className="monospace-font">
        {Object.entries(globalVars)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => (
            <FormattedValue
              k={key}
              value={String(value)}
              maxStringWidth={maxStringWidth}
            />
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
        
        <div className="monospace-font">
          <span className="variable-name">{classVars.is_stage ? "Current Backdrop" : "Current Costume"}: </span>
          <span style={{ color: "blue" }}>{actorVars.costume_index}</span>
        </div>
        <VariableList variables={classVars.display_costumes_and_sounds()} />
        <hr className="my-2" />
        {/* Static variables */}
        <div className="monospace-font flex-fill">
          {Object.entries(classVars.static)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value], index) => (
              <div key={`static-${index}`}>
          <span className="variable-name">{key}: </span>
          <FormattedValue
            k={key}
            value={typeof value === "object" && value !== null && "v" in value ? value.v : value}
            maxStringWidth={maxStringWidth}
          />
              </div>
            ))}
        </div>

        {actorVars.has_variables("local") && <hr className="my-2" />}

        {/* Local variables */}
        <VariableList variables={actorVars.display_variables("local")} />
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

  const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down"
  return (
    <Card>
      <Card.Body>
      <Card.Title className="d-flex justify-content-between align-items-center">
        {name}
        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.7em", cursor: "pointer" }} onClick={() => setIsExpanded(!isExpanded)}>
            {actorEntries.length} instances
            <FontAwesomeIcon icon={collapseOrExpandIcon} className="collapse-or-expand-icon" />
        </span>
      </Card.Title>

        {/* Static variables */}
        <VariableList variables={classVars.display_costumes_and_sounds()} />
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
