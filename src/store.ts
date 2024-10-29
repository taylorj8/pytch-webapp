import { createStore, createTypedHooks } from "easy-peasy";
import { pytchAppModel, IPytchAppModel } from "./model";
import { PYTCH_CYPRESS } from "./utils";

const { useStoreActions, useStoreState, useStoreDispatch } =
  createTypedHooks<IPytchAppModel>();

export { useStoreActions, useStoreDispatch, useStoreState };

const store = createStore(pytchAppModel);
export type PytchAppStore = typeof store;

PYTCH_CYPRESS()["easyPeasyStore"] = store;

export default store;
