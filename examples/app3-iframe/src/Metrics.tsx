import { useState } from "react";
import { useEventBusMetrics } from "./use-event-bus";

export function Metrics() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { metrics } = useEventBusMetrics();
  const onClick = () => {
    setIsExpanded((prev) => !prev);
  };
  return (
    <div className="card">
      <h2>Metrics</h2>
      <p>
        collected by{" "}
        <a
          href="https://www.npmjs.com/package/@runnel/metric-plugin"
          target="_blank"
        >
          @runnel/metric-plugin
        </a>
      </p>
      <table>
        <thead>
          <tr>
            <th>Topic ID</th>
            <th>published (times)</th>
            <th>subscribed (times)</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(metrics).map((topicId) => (
            <tr key={topicId}>
              <td>{topicId}</td>
              <td>{metrics[topicId].onPostMessage}</td>
              <td>{metrics[topicId].onAddEventListener}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onClick}>Details</button>
      {isExpanded && (
        <pre style={{ textWrap: "wrap" }}>{JSON.stringify(metrics)}</pre>
      )}
    </div>
  );
}
