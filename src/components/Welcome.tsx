import React, { useEffect } from "react";
import NavBanner from "./NavBanner";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { EditorKindThumbnail } from "./EditorKindThumbnail";
import { Header } from "./front-page/Header";
import { CodingJourney } from "./front-page/CodingJourney";
import { CardCarousel } from "./front-page/CardCarousel";
import { LearnPython } from "./front-page/LearnPython";
import { ContactInvitation } from "./front-page/ContactInvitation";
import { Footer } from "./front-page/Footer";
import { useScrollToUrlFragment } from "./hooks/use-fragment-scroll";
import "./Welcome.scss";

const Welcome: React.FC<EmptyProps> = () => {
  useEffect(() => {
    document.title = "Pytch";
  });

  useScrollToUrlFragment();

  return (
    <>
      <NavBanner />
      <div className="welcome-text">
        <Header />
        <CodingJourney />

        <h3 className="pytch-summary">
          Pytch helps people to learn Python by building on skills they have
          developed in Scratch
        </h3>

        <CardCarousel />
        <LearnPython />
        <ContactInvitation />
        <Footer />
      </div>
    </>
  );
};

export default Welcome;
