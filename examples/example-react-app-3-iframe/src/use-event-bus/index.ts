import deepEqual from "deep-equal";
import { useCallback, useEffect, useState } from "react";
import { eventBus, metricsObserver } from "./event-bus";
import { EventBusMetricPluginPayload } from "./event-bus-plugin";

export function useEventBus() {
  const [metrics, setMetrics] = useState<EventBusMetricPluginPayload>({});

  const updateMetrics = useCallback(
    (incomingData: EventBusMetricPluginPayload) => {
      if (!deepEqual(metrics, incomingData)) {
        setMetrics(incomingData);
      }
    },
    [metrics],
  );

  useEffect(() => {
    metricsObserver.subscribe(updateMetrics);
    return () => metricsObserver.unsubscribe(updateMetrics);
  }, [updateMetrics]);

  return { eventBus, metrics };
}
