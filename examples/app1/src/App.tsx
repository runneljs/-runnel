import { useEffect, useState } from "react";
import { runnel } from "runneljs";
import "./App.css";

type Schemas = {
  count: number;
  fullName: {
    firstName: string;
    lastName: string;
  };
};

const { registerTopic } = runnel<Schemas>();
const countTopic = registerTopic("count");
const fullNameTopic = registerTopic("fullName");

function App() {
  const [count, setCount] = useState<Schemas["count"]>(0);
  useEffect(() => {
    const unsubscribe = countTopic.subscribe(setCount);
    return () => unsubscribe();
  }, []);

  const [fullName, setFullName] = useState<Schemas["fullName"]>({
    firstName: "",
    lastName: "",
  });
  useEffect(() => {
    const unsubscribe = fullNameTopic.subscribe((payload) => {
      setFullName(payload);
    });
    return () => unsubscribe();
  }, []);

  const clickHandler = () => {
    countTopic.publish(count + 1);
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
