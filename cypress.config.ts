import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  numTestsKeptInMemory: 0,
  viewportWidth: 1280,
  viewportHeight: 1024,
  defaultCommandTimeout: 10000,
  e2e: {
    testIsolation: false,
    experimentalRunAllSpecs: true,
    baseUrl: "http://localhost:3000/",
    excludeSpecPattern: ["*.js~"],
  },
});
