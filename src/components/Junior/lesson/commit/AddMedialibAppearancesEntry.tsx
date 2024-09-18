import React from "react";
import {
  ActorIdentifierOps,
  LearnerTaskCommitAddMedialibAppearancesEntry,
} from "../../../../model/junior/jr-tutorial";
import { ActorKindOps } from "../../../../model/junior/structured-program";
import { InlineAddSomethingButton } from "../../AddSomethingButton";

// TODO: Include thumbnail of required costume?

export const AddMedialibAppearancesEntry: React.FC<
  LearnerTaskCommitAddMedialibAppearancesEntry
> = ({ actor, displayIdentifier, nItems }) => {
  const actorKindNames = ActorKindOps.names(actor.kind);
  const actorNounPhrase = ActorIdentifierOps.nounPhrase(actor);
  const entryNoun = nItems === 1 ? "image" : "images";

  return (
    <div className="JrCommit Commit-AddMedialibAppearancesEntry">
      <p>
        In the <i>Stage and Sprites</i> pane, select {actorNounPhrase}.
      </p>
      <p>
        In the coding pane, select the {actorKindNames.appearancesDisplayTitle}{" "}
        tab.
      </p>
      <p>
        Click the{" "}
        <InlineAddSomethingButton
          what={`${actor.kind}-asset`}
          label="Add from media library"
        />{" "}
        button.
      </p>
      <p>
        Find the “<strong>{displayIdentifier}</strong>” {entryNoun}, and click
        the “Add {nItems} to project” button.
      </p>
    </div>
  );
};
