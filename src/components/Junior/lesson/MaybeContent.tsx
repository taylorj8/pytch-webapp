import React from "react";
import { EmptyProps, assertNever } from "../../../utils";
import { useLinkedContentLoadingStateSummary } from "../../../model/linked-content";

import { Content } from "./Content";
import { ContentLoadingSpinner } from "./ContentLoadingSpinner";
import { SpecimenInformation } from "./SpecimenInformation";

export const MaybeContent: React.FC<EmptyProps> = () => {
  const linkedContentState = useLinkedContentLoadingStateSummary();

  switch (linkedContentState.kind) {
    case "idle":
      return null;
    case "succeeded": {
      const contentKind = linkedContentState.contentKind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
          return <Content />;
        case "specimen":
          return <SpecimenInformation />;
        default:
          return assertNever(contentKind);
      }
    }
    case "failed":
      console.log("have failed to load linked content");
      return null;
    case "pending": {
      const contentKind = linkedContentState.contentKind;
      switch (contentKind) {
        case "none":
          return null;
        case "jr-tutorial":
        case "specimen":
          return <ContentLoadingSpinner />;
        default:
          return assertNever(contentKind);
      }
    }
    default:
      return assertNever(linkedContentState);
  }
};
