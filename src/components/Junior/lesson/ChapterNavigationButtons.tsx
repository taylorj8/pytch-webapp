import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ChapterNavigation = {
  displayTitle: string;
  navigate: () => void;
};
export type ChapterNavigationButtonsProps = {
  next?: ChapterNavigation;
  prev?: ChapterNavigation;
};
export const ChapterNavigationButtons: React.FC<
  ChapterNavigationButtonsProps
> = ({ next, prev }) => {
  // To keep the layout simple (via justify-content: space-between),
  // generate an empty DIV for an unwanted button, rather than leaving
  // that element out altogether.

  const mPrevButton =
    prev != null ? (
      <Button variant="secondary" className="prev" onClick={prev.navigate}>
        <FontAwesomeIcon className="prev-arrow" icon="arrow-left-long" /> Back:{" "}
        {prev.displayTitle}
      </Button>
    ) : (
      <div />
    );

  const mNextButton =
    next != null ? (
      <Button className="next" onClick={next.navigate}>
        Next: {next.displayTitle}{" "}
        <FontAwesomeIcon className="next-arrow" icon="arrow-right-long" />
      </Button>
    ) : (
      <div />
    );

  return (
    <div className="Junior-ChapterNavigation">
      {mPrevButton}
      {mNextButton}
    </div>
  );
};
