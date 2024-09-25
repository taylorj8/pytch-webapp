import React from "react";
import { makeScratchSVG } from "../../../model/scratchblocks-render";
import RawElement from "../../RawElement";
import { highlightedPreEltsFromCode } from "../../../model/highlight-as-ace";

const elementIsCodeOfLanguage = (
  elt: HTMLElement,
  languageTag: string
): boolean => {
  const languageClass = `language-${languageTag}`;
  return (
    elt instanceof HTMLPreElement &&
    elt.firstChild instanceof HTMLElement &&
    elt.firstChild.tagName === "CODE" &&
    elt.firstChild.classList.contains(languageClass)
  );
};

const elementIsScratchCode = (elt: HTMLElement) =>
  elementIsCodeOfLanguage(elt, "scratch");

const elementIsPythonCode = (elt: HTMLElement) =>
  elementIsCodeOfLanguage(elt, "python");

type RawOrCodeSnippetProps = { element: HTMLElement };
export const RawOrCodeSnippet: React.FC<RawOrCodeSnippetProps> = ({
  element,
}) => {
  return <RawElement element={withCodeSnippetsRendered(element)} />;
};

export const withCodeSnippetsRendered = (element: HTMLElement): HTMLElement => {
  if (elementIsScratchCode(element)) {
    let div = document.createElement("div");
    div.className = "display-scratchblocks";
    div.appendChild(makeScratchSVG(element.innerText, 0.8));
    return div;
  }

  if (elementIsPythonCode(element)) {
    let div = document.createElement("div");
    div.className = "python-snippet";
    const codeText = element.innerText.trimEnd();
    const codeElts = highlightedPreEltsFromCode(codeText);
    codeElts.forEach((elt) => div.appendChild(elt));
    return div;
  }

  let augElement = element.cloneNode() as HTMLElement;
  element.childNodes.forEach((node) => {
    augElement.appendChild(
      node.nodeType === Node.ELEMENT_NODE
        ? withCodeSnippetsRendered(node as HTMLElement)
        : node.cloneNode()
    );
  });

  return augElement;
};
