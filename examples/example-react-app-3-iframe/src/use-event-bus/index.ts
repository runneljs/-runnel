import { useState } from "react";
import { Metrics, eventBus, metricsObserver } from "./event-bus";
export { type Metrics };

export function useEventBus() {
  const [metrics, setMetrics] = useState<Metrics>({});
  metricsObserver.subscribe(setMetrics);
  return { eventBus, metrics };
}
