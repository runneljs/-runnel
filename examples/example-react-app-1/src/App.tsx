import { useEffect, useState } from "react";
import { Validator } from "@cfworker/json-schema";
import deepEqual from "deep-equal";
import {
  PayloadMismatchError,
  SchemaMismatchError,
  createEventBus,
} from "mfe-event-bus";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import "./App.css";

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}
/**
 * The parameters `deepEqual` and `payloadValidator` are replaceable.
 * - deepEqual: App 1 uses `deep-equal`. App 2 uses `lodash.isequal`.
 * - payloadValidator: App 1 uses `@cfworker/json-schema`. App 2 uses `ajv`.
 * Whichever the eventBus attached to the window object first will be used.
 */
const { registerTopic } = createEventBus(deepEqual, payloadValidator);

/**
 * The lines creating topics below will be identical in both apps.
 * It looks redundant, but because micro-frontend apps should be independent,
 * they should not share the same codebase.
 */
const countTopic = registerTopic<number>("count", {
  type: "number",
});

try {
  /**
   * Intentionally publishing a topic with an incorrect payload.
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  countTopic.publish("oops");
} catch (e) {
  console.warn(e);
  const { topicName, jsonSchema, payload } =
    e as unknown as PayloadMismatchError;
  console.warn({ topicName });
  console.warn({ jsonSchema: JSON.stringify(jsonSchema) });
  console.warn({ payload: JSON.stringify(payload) });
}

try {
  /**
   * Intentionally registering a topic with an incorrect schema.
   */
  registerTopic("oops", { type: "number" });
} catch (e) {
  console.warn(e);
  const { topicName, jsonSchema, incomingJsonSchema } =
    e as unknown as SchemaMismatchError;
  console.warn({ topicName });
  console.warn({ jsonSchema: JSON.stringify(jsonSchema) });
  console.warn({ incomingJsonSchema: JSON.stringify(incomingJsonSchema) });
}

const fullNameSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});
type FullNameSchema = z.infer<typeof fullNameSchema>;
const fullNameTopic = registerTopic<FullNameSchema>(
  "fullName",
  zodToJsonSchema(fullNameSchema),
);

function App() {
  const [fullName, setFullName] = useState({
    firstName: "",
    lastName: "",
  });
  const [count, setCount] = useState(0);
  useEffect(() => {
    fullNameTopic.subscribe((payload) => {
      setFullName(payload);
    });
  });
  const clickHandler = () => {
    countTopic.publish(count + 1);
    setCount((count) => count + 1);
  };

  return (
    <>
      <h1>App 1</h1>
      <div className="card">
        <button onClick={clickHandler}>count is {count}</button>
      </div>
      <div className="card">
        <p>
          Your name is {fullName.firstName} {fullName.lastName}.
        </p>
      </div>
    </>
  );
}

export default App;
