import React, { useEffect } from "react";
import { scrollTopFromPageKey } from "../../../model/junior/jr-tutorial";

export type DivScrollerProps = {
  pageKey: number;
  containerDivRef: React.RefObject<HTMLDivElement>;
};

// TODO: Compare this and the equivalent for "flat" tutorials and settle
// on one approach.
export const DivScroller: React.FC<DivScrollerProps> = (props) => {
  useEffect(() => {
    const containerDiv = props.containerDivRef.current;
    if (containerDiv != null) {
      const desiredScrollTop = scrollTopFromPageKey.get(props.pageKey) ?? 0;
      setImmediate(() => {
        containerDiv.scrollTop = desiredScrollTop;
      });

      const updateScrollTopMap = () =>
        scrollTopFromPageKey.set(props.pageKey, containerDiv.scrollTop);

      containerDiv.addEventListener("scroll", updateScrollTopMap);

      return () =>
        containerDiv.removeEventListener("scroll", updateScrollTopMap);
    }
  });

  return null;
};
