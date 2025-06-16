import React from "react";
import { EmptyProps } from "../../utils";

export const DisplayDropdownButton: React.FC<EmptyProps> = () => {
  return (
    <span className="DisplayDropdownButton">
      ⋮<span className="down-triangle">▾</span>
    </span>
  );
};
