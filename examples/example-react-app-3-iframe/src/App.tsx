import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import "./App.css";
import { useEventBus } from "./use-event-bus";
import { Metrics } from "./Metrics";

function App() {
  const [count, setCount] = useState(0);
  const { countTopic, metrics } = useCounterTopic();
  const { fullName } = useFullNameTopic();

  const clickHandler = () => {
    countTopic.publish(count + 1);
    setCount((count) => count + 1);
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
      <Metrics metrics={metrics} />
    </>
  );
}

export default App;

function useCounterTopic() {
  const { metrics, eventBus } = useEventBus();
  const countTopic = eventBus.registerTopic<number>("count", {
    type: "number",
  });

  return { countTopic, metrics };
}

function useFullNameTopic() {
  const { eventBus } = useEventBus();
  const fullNameTopic = useMemo(() => {
    const fullNameSchema = z.object({
      firstName: z.string(),
      lastName: z.string(),
    });
    type FullNameSchema = z.infer<typeof fullNameSchema>;
    return eventBus.registerTopic<FullNameSchema>(
      "fullName",
      zodToJsonSchema(fullNameSchema),
    );
  }, [eventBus]);

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
