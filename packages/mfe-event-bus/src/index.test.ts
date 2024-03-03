import { Validator } from "@cfworker/json-schema";
import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import isEqual from "lodash.isequal";
import { createEventBus } from "./index";

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}

describe("EventBus", () => {
  let globalScope: any;
  beforeAll(() => {
    globalScope = {};
  });

  let eventBus: ReturnType<typeof createEventBus>;
  beforeEach(() => {
    eventBus = createEventBus({
      deepEqual: isEqual,
      payloadValidator,
      scope: globalScope,
    });
  });

  describe("createEventBus", () => {
    test("it creates an eventBus", () => {
      expect(eventBus).toBeDefined();
    });

    test("it attaches things to the global objects", () => {
      expect(globalScope.mfeEventBusSubscriptionStore).toBeDefined();
      expect(globalScope.mfeEventBusLatestStateStore).toBeDefined();
      expect(globalScope.mfeEventBusSchemaStore).toBeDefined();
    });
  });
});
