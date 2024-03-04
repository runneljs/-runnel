import { useEventBusMetrics } from "./use-event-bus";

export function Metrics() {
  const { metrics } = useEventBusMetrics();
  return (
    <div className="card">
      <h2>Metrics</h2>
      <p>In this app...</p>
      <ul>
        {Object.keys(metrics)
          .filter((topicId) => metrics[topicId].publish)
          .map((topicId) => (
            <li key={topicId}>
              <strong>{topicId}</strong> has had {metrics[topicId].publish}{" "}
              publish events
            </li>
          ))}
      </ul>
      <ul>
        {Object.keys(metrics)
          .filter((topicId) => metrics[topicId].subscribe)
          .map((topicId) => (
            <li key={topicId}>
              <strong>{topicId}</strong> has {metrics[topicId].subscribe}{" "}
              subscribe events
            </li>
          ))}
      </ul>
      <pre style={{ textWrap: "wrap" }}>{JSON.stringify(metrics)}</pre>
    </div>
  );
}
