import {
  deleteAllCodeOfSoleHandler,
  selectActorAspect,
  selectSprite,
  usingPytchJrProgram,
} from "./utils";

context("Use Python stdlib modules", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const setScriptCode = (codeText: string) => {
    selectSprite("Snake");
    selectActorAspect("Code");
    cy.get(".ace_editor").contains("Hi there").should("be.visible");
    usingPytchJrProgram((program, actions) => {
      actions.setHandlerPythonCode({
        actorId: program.actors[1].id,
        handlerId: program.actors[1].handlers[0].id,
        code: codeText,
      });
    });
  };

  it("can use math module", () => {
    setScriptCode("print(math.gcd(30, 45))");
    cy.pytchGreenFlag();
    cy.pytchStdoutShouldEqual("15\n");
  });
});
