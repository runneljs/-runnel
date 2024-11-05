import "./App.css";
import { useTopicSubscription } from "./use-topic-subscription";

function App() {
  const { state: fullName } = useTopicSubscription("fullName", {
    firstName: "",
    lastName: "",
  });
  const { state: count, topic: countTopic } = useTopicSubscription("count", 0);

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
    </>
  );
}

export default App;
