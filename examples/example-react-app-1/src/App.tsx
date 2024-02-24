import { useEffect, useState } from "react";
import deepEqual from "deep-equal";
import { createEventBus } from "mfe-event-bus";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import "./App.css";

/**
 * App 1 uses `deep-equal`. App 2 uses `lodash.isequal`.
 * Whichever attached to the window object first will be used.
 * The point is that `deepEqual` is replaceable.
 */
const { registerTopic } = createEventBus(deepEqual);

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
