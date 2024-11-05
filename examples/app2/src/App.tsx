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

/**
 * The lines creating topics below will be identical in both apps.
 * It looks redundant, but because micro-frontend apps should be independent,
 * they should not share the same codebase.
 */
const countTopic = registerTopic("count");

const fullNameTopic = registerTopic("fullName");

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
