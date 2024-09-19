import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitDeleteAppearance,
} from "../../../../model/junior/jr-tutorial";
import { ActorKindOps } from "../../../../model/junior/structured-program";
import { DisplayDropdownButton } from "../../DisplayDropdownButton";

export const DeleteAppearance: React.FC<LearnerTaskCommitDeleteAppearance> = ({
  actor,
  appearanceFilename,
}) => {
  const actorKindNames = ActorKindOps.names(actor.kind);
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(actor);

  return (
    <div className="JrCommit Commit-DeleteAppearance">
      <p>
        In the <i>Stage and Sprites</i> pane, select {actorNounPhrase}.
      </p>
      <p>
        In the coding pane, select the {actorKindNames.appearancesDisplayTitle}{" "}
        tab.
      </p>
      <p>
        Find the {actorKindNames.appearanceDisplay} called{" "}
        <code>{appearanceFilename}</code> and click the{" "}
        <DisplayDropdownButton /> button at its top right.
      </p>
      <p>
        Choose the <code>DELETE</code> menu item. In the dialog box which
        appears, click the <code>DELETE</code> button to confirm that you want
        to delete this {actorKindNames.appearanceDisplay}.
      </p>
    </div>
  );
};
