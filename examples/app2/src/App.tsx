import { useState } from "react";
import "./App.css";
import { useTopicSubscription } from "./use-topic-subscription";

function App() {
  const { state: fullName, topic: fullNameTopic } = useTopicSubscription(
    "fullName",
    {
      firstName: "Luke",
      lastName: "Skywalker",
    },
  );
  const [localFullName, setLocalFullName] = useState(fullName);

  const { state: count } = useTopicSubscription("count", 0);

  const buttonOnClick = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fullNameTopic.publish(localFullName);
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
            value={localFullName.firstName}
            onChange={(e) =>
              setLocalFullName((fullName) => ({
                ...fullName,
                firstName: e.target.value,
              }))
            }
          />
          <input
            style={{ display: "block" }}
            value={localFullName.lastName}
            onChange={(e) =>
              setLocalFullName((fullName) => ({
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
          My name is {localFullName.firstName} {localFullName.lastName}.
        </p>
      </div>
    </>
  );
}

export default App;
