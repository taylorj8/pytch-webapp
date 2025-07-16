/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Collapse from "react-bootstrap/Collapse";

const maxStringWidth = 35;

type Variable = { key: string; val: any; };

interface FormattedValueProps {
  var_name: string;
  value: any;
  maxStringWidth: number;
}

const FormattedValue: React.FC<FormattedValueProps> = ({
  var_name,
  value,
  maxStringWidth,
}) => {
  const [expandedStrings, setExpandedStrings] = useState<Record<string, boolean>>({});
  const toggle = () =>
    setExpandedStrings((prev) => ({ ...prev, [var_name]: !prev[var_name] }));

  const variable_name = <span className="variable-name">{var_name}: </span>;

  const isExpanded = expandedStrings[var_name] ?? false;
  const type = Array.isArray(value) ? "array" : typeof value;

  if (type === "string") {
    const shouldTruncate = value.length + var_name.length > maxStringWidth;
    const displayStr =
      shouldTruncate && !isExpanded
        ? value.slice(0, maxStringWidth - var_name.length - 3) + "[…]"
        : value;

    return <span>
      {variable_name}
      <span
        style={{ color: "green", cursor: shouldTruncate ? "pointer" : "default" }}
        onClick={shouldTruncate ? toggle : undefined}
        title={!shouldTruncate ? "string" : isExpanded ? "Click to collapse string" : "Click to expand string"}
      >
        "{displayStr}"
      </span>
    </span>
  }

  if (type === "number") {
    const num = Number(value);
    const display = Number.isInteger(num) ? num : num.toFixed(3);
    return <span>
      {variable_name}
      <span 
        className="variable-value" 
        style={{ color: "blue" }} 
        title="number">{display}
      </span>
    </span>
  }

  if (type === "boolean") {
    return <span>
      {variable_name}
      <span 
        className="variable-value" 
        style={{ color: "darkorange" }} 
        title="boolean">{value ? "True" : "False"}
      </span>
    </span>
  }

  if (type === "array") {
    const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down";
    return <span>
      {variable_name}
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
            <div key={`${var_name}-${idx}`}>
              <FormattedValue
                var_name={idx.toString()}
                value={extractValue(elem)}
                maxStringWidth={maxStringWidth - 3}
              />
            </div>
          ))}
        </div>
      </Collapse>
    </span>
  }

  if (type === "object") {
    // if the object is a reference to another instance return just the name
    if ("info_label" in value || "$pytchActorInstance" in value) {
      const label = value.info_label ?? value.$pytchActorInstance.info_label;
      return <span>
        {variable_name}
        <span
          className="variable-value"
          style={{ color: "mediumvioletred" }}
          title="Reference to another instance"
        >
          {label}
        </span>
      </span>
    }

    const keys = Object.keys(value);
    const collapseOrExpandIcon = isExpanded ? "angle-up" : "angle-down";

    console.log(value)

    return <span>
      {variable_name}
      <span
        style={{ color: "brown", cursor: "pointer" }}
        title="object"
        onClick={toggle}
      >
        {"{"}Object({keys.length}){"}"}
        <FontAwesomeIcon icon={collapseOrExpandIcon} className="collapse-or-expand-icon" />
      </span>
      <Collapse in={isExpanded}>
        <div style={{ paddingLeft: "1rem" }}>
          {keys.map((k) => (
              <div key={k}>
                {/* // todo - format keys? */}
                <FormattedValue
                  var_name={k}
                  value={extractValue(value[k][1])}
                  maxStringWidth={maxStringWidth - 3}
                />
              </div>
          ))}
        </div>
      </Collapse>
    </span>
  }

  return <span>{variable_name}{String(value)}</span>
};

interface VariableListProps {
  variables: Variable[];
}

const VariableList: React.FC<VariableListProps> = ({variables}) => {
  return (
    <div className="monospace-font">
      {variables.map((variable, index) => {
        return (
          <div key={`${index}-${variable.key}`}>
            <FormattedValue
              var_name={variable.key}
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
}

// Card that shows instances of a cloned actor within the Actor Class Card
export const ActorInstanceCard: React.FC<ActorInstanceProps> = ({
    actorId,
    actorVars,
    highlighted,
  }) => (
    <Card className={`mt-2 mb-0 ${highlighted ? "highlighted-card" : "inner-card"}`}>
      <Card.Body>
        <Card.Title className="d-flex align-items-center">
          <img src={actorVars.img_src} className="card-title-img" style={{filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"}} />
            <strong style={{ fontSize: "95%" }}>{actorId}</strong>
        </Card.Title>
  
        <div className="monospace-font mb-1">
          <span className="variable-name">costume_number: </span><span className="variable-value" style={{ color: "blue" }}>{actorVars.costume_index}</span>
        </div>
        <div className="monospace-font mb-2">
           <span className="variable-name">position: </span><span className="variable-value">{actorVars.position.toString()}</span>
        </div>
  
        {actorVars.has_instance_variables() && <hr className="my-2" />}
        <VariableList variables={actorVars.get_instance_variables()} />
        {actorVars.has_local_variables() && <hr className="my-2" />}
        <VariableList variables={actorVars.get_local_variables()} />
      </Card.Body>
    </Card>
  );
  

// Card that shows global variables if any exist
export const GlobalVariablesCard: React.FC<{ globalVars: any }> = ({ globalVars }) => (
  <Card className="mt-0 mb-2">
    <Card.Body>
      <Card.Title>
        <FontAwesomeIcon icon="earth-europe" className="card-title-icon" />
        Global Variables
      </Card.Title>
      <div className="monospace-font">
        {Object.entries(globalVars)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => (
            <div key={key}>
              <FormattedValue
                var_name={key}
                value={extractValue(value)}
                maxStringWidth={maxStringWidth}
              />
            </div>
          ))}
      </div>
    </Card.Body>
  </Card>
);


// Card that shows any actors that do not have clones - includes the Stage
export const UnclonedActorCard: React.FC<{
  name: string;
  classVars: any;
  actorVars: any;
  highlighted: boolean;
}> = ({ name, classVars, actorVars, highlighted }) => (
  <Card className={`mb-2 ms-0 me-0 ${highlighted ? "highlighted-card" : ""}`}>
    <Card.Body>
      <Card.Title className="d-flex align-items-center">
        <img src={actorVars.img_src} className="card-title-img" style={{filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"}}/>
        <strong>{name}</strong>
      </Card.Title>

      <div>
        {!classVars.is_stage && (
          <div className="mt-3 monospace-font">
            <span className="variable-name">position: </span><span className="variable-value">{actorVars.position.toString()}</span>
          </div>
        )}
        
        <div className="monospace-font">
          <span className="variable-name">{classVars.is_stage ? "backdrop_number" : "costume_number"}: </span>
          <span className="variable-value" style={{ color: "blue" }}>{actorVars.costume_index}</span>
        </div>

        <VariableList variables={classVars.display_costumes_and_sounds()} />
        {classVars.has_static_variables() && <hr className="my-2" />}
        <VariableList variables={classVars.get_static_variables()} />

        {actorVars.has_instance_variables() && <hr className="my-2" />}
        <VariableList variables={actorVars.get_instance_variables()} />
        {actorVars.has_local_variables() && <hr className="my-2" />}
        <VariableList variables={actorVars.get_local_variables()} />
      </div>
    </Card.Body>
  </Card>
);

// Contains a list of ActorInstanceCards and static variables
export const ActorClassCard: React.FC<{
  name: string;
  classVars: any;
  highlightedInstance: string;
}> = ({ name, classVars, highlightedInstance }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const actorEntries = Object.entries(classVars.actors);

  if (!classVars.has_clones()) {
    const actorVars = actorEntries[0][1];
    return (
      <UnclonedActorCard
        name={name}
        classVars={classVars}
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
        <span>
          <span className="actor-classcard-img-stack">
            <img
              src={(actorEntries[0][1] as any).img_src}
              className="actor-classcard-img-top"
            />
            <img
              src={(actorEntries[1][1] as any).img_src}
              className="actor-classcard-img-bottom"
            />
          </span>
          <strong>{name}</strong>
        </span>
        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.7em", cursor: "pointer" }} onClick={() => setIsExpanded(!isExpanded)}>
            {actorEntries.length} instances
            <FontAwesomeIcon icon={collapseOrExpandIcon} className="collapse-or-expand-icon" />
        </span>
      </Card.Title>

        {/* Static variables */}
        <VariableList variables={classVars.display_costumes_and_sounds()} />
        <VariableList variables={classVars.get_static_variables()} />

        {/* Cloned actor instances */}
        <Collapse in={isExpanded}>
          <div className="clone-container">
            {actorEntries.map(([actorId, actorVars]: [string, any]) => (
              <ActorInstanceCard
                key={actorId}
                actorId={actorId}
                actorVars={actorVars}
                highlighted={actorId === highlightedInstance}
              />
            ))}
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

function extractValue(elem: any): any {
  if (elem && typeof elem === "object") {
    if ("v" in elem) return elem.v;
    if ("entries" in elem) return elem.entries;
  }
  return elem;
}