import { useEffect, useState } from "react";
import isEqual from "lodash.isequal";
import { createEventBus } from "mfe-event-bus";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import "./App.css";

/**
 * App 1 uses `deep-equal`. App 2 uses `lodash.isequal`.
 * Whichever attached to the window object first will be used.
 * The point is that `deepEqual` is replaceable.
 */
const { registerTopic } = createEventBus(isEqual);

/**
 * The lines creating topics below will be identical in both apps.
 * It looks redundant, but because micro-frontend apps should be independent,
 * they should not share the same codebase.
 */
const countTopic = registerTopic<number>("count", {
  payloadValidator: (payload: number) => typeof payload === "number",
  jsonSchema: {
    type: "number",
  },
});

const fullNameSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});
const schemaInfo = {
  payloadValidator: (value: unknown) => fullNameSchema.safeParse(value).success,
  jsonSchema: zodToJsonSchema(fullNameSchema),
};
type FullNameSchema = z.infer<typeof fullNameSchema>;
const fullNameTopic = registerTopic<FullNameSchema>("fullName", schemaInfo);

function App() {
  const [fullName, setFullName] = useState({
    firstName: "Luke",
    lastName: "Skywalker",
  });
  const [count, setCount] = useState(0);
  useEffect(() => {
    countTopic.subscribe((payload) => {
      setCount(payload);
    });
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
