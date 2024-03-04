import { useEffect, useState } from "react";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import "./App.css";
import { Metrics } from "./Metrics";
import { useEventBus } from "./use-event-bus";

function App() {
  const { fullName } = useFullNameTopic();
  const { count, countTopic } = useCounterTopic();

  const clickHandler = () => {
    countTopic.publish(count + 1);
  };

  return (
    <>
      <h1>App 3</h1>
      <div className="card">
        <button onClick={clickHandler}>count is {count}</button>
      </div>
      <div className="card">
        <p>
          Your name is {fullName.firstName} {fullName.lastName}.
        </p>
      </div>
      <Metrics />
    </>
  );
}

export default App;

function useCounterTopic() {
  const countTopic = useEventBus<number>("count", {
    type: "number",
  });

  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsubscribe = countTopic.subscribe(setCount);
    return () => unsubscribe();
  }, [countTopic]);
  return { count, countTopic };
}

function useFullNameTopic() {
  const fullNameSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
  });
  type FullNameSchema = z.infer<typeof fullNameSchema>;
  const fullNameTopic = useEventBus<FullNameSchema>(
    "fullName",
    zodToJsonSchema(fullNameSchema),
  );

  const [fullName, setFullName] = useState({
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    const unsubscribe = fullNameTopic.subscribe((payload) => {
      setFullName(payload);
    });
    return () => unsubscribe();
  }, [fullNameTopic]);

  return { fullName };
}
