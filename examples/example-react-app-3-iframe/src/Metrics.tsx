import { EventBusMetricPluginPayload } from "./use-event-bus/event-bus-plugin";

export function Metrics({ metrics }: { metrics: EventBusMetricPluginPayload }) {
  return (
    <div className="card">
      <h2>Metrics</h2>
      <p>In this app...</p>
      <ul>
        {metrics.publishStats &&
          Object.keys(metrics.publishStats).map((topicId) => (
            <li key={topicId}>
              {topicId} has had{" "}
              {metrics.publishStats && metrics.publishStats[topicId]} publishes
            </li>
          ))}
      </ul>
      <ul>
        {metrics.subscribeStats &&
          Object.keys(metrics.subscribeStats).map((topicId) => (
            <li key={topicId}>
              {topicId} has{" "}
              {metrics.subscribeStats && metrics.subscribeStats[topicId].length}{" "}
              subscriber(s)
            </li>
          ))}
      </ul>
      <pre style={{ textWrap: "wrap" }}>{JSON.stringify(metrics)}</pre>
    </div>
  );
}
