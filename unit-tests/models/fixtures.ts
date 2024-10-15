import { AssetNameAndType } from "../../src/database/indexed-db";
import {
  StructuredProgramOps,
} from "../../src/model/junior/structured-program";

export const threeSpriteProgramNames = ["Sprite1", "Sprite2", "Sprite4"];

export const threeSpriteProgram = () => {
  let program = StructuredProgramOps.newEmpty();
  threeSpriteProgramNames.forEach((name) =>
    StructuredProgramOps.addSprite(program, name)
  );
  return program;
};

type AssetOrderingData = {
  assets: Array<AssetNameAndType>;
  expIndexes: Array<number>;
};
