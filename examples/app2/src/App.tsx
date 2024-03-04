import { useEffect, useState } from "react";
import isEqual from "lodash.isequal";
import { SchemaMismatchError, createEventBus } from "runneljs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import Ajv from "ajv";
import "./App.css";

const ajv = new Ajv();
function payloadValidator(jsonSchema: object) {
  return ajv.compile(jsonSchema);
}

/**
 * The parameters `deepEqual` and `payloadValidator` are replaceable.
 * - deepEqual: App 1 uses `deep-equal`. App 2 uses `lodash.isequal`.
 * - payloadValidator: App 1 uses `@cfworker/json-schema`. App 2 uses `ajv`.
 * Whichever the eventBus attached to the window object first will be used.
 */
const { registerTopic } = createEventBus({
  deepEqual: isEqual,
  payloadValidator,
});

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
   * Intentionally registering a topic with an incorrect schema.
   */
  registerTopic("oops", { type: "string" });
} catch (e) {
  console.warn(e);
  const { topicId, jsonSchema, incomingJsonSchema } =
    e as unknown as SchemaMismatchError;
  console.warn({ topicName: topicId });
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
    firstName: "Luke",
    lastName: "Skywalker",
  });
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsubscribe = countTopic.subscribe((payload) => {
      setCount(payload);
    });
    return () => unsubscribe();
  }, []);

  const buttonOnClick = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fullNameTopic.publish(fullName);
  };

  return (
    <>
      <h1>App 2</h1>
      <div className="card">count is {count}</div>
      <div className="card">
        <form>
          <h2>Tell me your name.</h2>
          <input
            style={{ display: "block" }}
            value={fullName.firstName}
            onChange={(e) =>
              setFullName((fullName) => ({
                ...fullName,
                firstName: e.target.value,
              }))
            }
          />
          <input
            style={{ display: "block" }}
            value={fullName.lastName}
            onChange={(e) =>
              setFullName((fullName) => ({
                ...fullName,
                lastName: e.target.value,
              }))
            }
          />
          <button style={{ display: "block" }} onClick={buttonOnClick}>
            Send it to the other app
          </button>
        </form>
        <p>
          My name is {fullName.firstName} {fullName.lastName}.
        </p>
      </div>
    </>
  );
}

export default App;
