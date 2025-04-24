import React from "react";
import { Link } from "../LinkWithinApp";
import { urlWithinApp } from "../../env-utils";
import { DecorativeUnderscore } from "../DecorativeUnderscore";
import "./Footer.scss";

// TODO: Use research site URL from constants.  Or generalise to function giving
// a particular page within research site.

export const Footer = () => {
  const riLogo = urlWithinApp("/assets/logos/RI-white-on-transparent.png");
  const tcdLogo = urlWithinApp("/assets/logos/TCD-white-on-transparent.png");
  const tudLogo = urlWithinApp("/assets/logos/TUD-white-on-transparent.png");

  return (
    <footer className="Footer">
      <div className="section-content">
        <div className="sitemap">
          <div className="list-container">
            <h2 id="contact-info">
              Contact us
              <DecorativeUnderscore />
            </h2>
            <ul>
              <li>
                <a href="mailto:info@pytch.org">Email</a>
              </li>
              <li>
                <a href="https://x.com/pytchlang/">X (Twitter)</a>
              </li>
            </ul>
          </div>
          <div className="list-container">
            <h2>
              About
              <DecorativeUnderscore />
            </h2>
            <ul>
              <li>
                <a href="https://pytch.scss.tcd.ie/who-we-are/">Our team</a>
              </li>
              <li>
                <a href="https://pytch.scss.tcd.ie/blog/">News</a>
              </li>
            </ul>
          </div>
          <div className="list-container">
            <h2>
              For teachers
              <DecorativeUnderscore />
            </h2>
            <ul>
              <li>
                <Link to="/tutorials/">Tutorials</Link>
              </li>
              <li>
                <a href="https://pytch.scss.tcd.ie/lesson-plans/">
                  Lesson plans
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="section-images">
          <img src={riLogo} alt="Research Ireland" />
          <img src={tcdLogo} alt="Trinity College Dublin" />
          <img src={tudLogo} alt="Technological University Dublin" />
        </div>
      </div>
    </footer>
  );
};
