import {
  onAddEventListenerEventName,
  onCreateTopicEventName,
  onPostMessageEventName,
  onRemoveEventListenerEventName,
  type DispatchEventName,
  type OnAddEventListenerEventDetail,
  type OnCreateTopicEventDetail,
  type OnPostMessageEventDetail,
  type OnRemoveEventListenerEventDetail,
} from "runneljs";

type JsonSchema = Object;
export type Metrics = {
  schema: JsonSchema;
  onCreateTopic: number;
  lastPayload: unknown;
  onPostMessage: number;
  onAddEventListener: number;
  onRemoveEventListener: number;
};

export type MetricsRecord = Record<string, Metrics>;
export function createEventBusMetricPlugin(
  deepEqual: (a: any, b: any) => boolean,
  callback: (payload: MetricsRecord) => void,
): {
  register: () => void;
  unregister: () => void;
} {
  /**
   * Count up subscribe/publish events called by the local event bus.
   */
  const metrics: MetricsRecord = {};
  const initialTopicMetrics: Metrics = {
    schema: {},
    onCreateTopic: 0,
    lastPayload: null,
    onPostMessage: 0,
    onAddEventListener: 0,
    onRemoveEventListener: 0,
  };

  function onRemoveEventListener(
    e: CustomEvent<OnRemoveEventListenerEventDetail>,
  ) {
    const { topicId } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onRemoveEventListener: metrics.onRemoveEventListener + 1,
      };
    });
  }

  function onAddEventListener(e: CustomEvent<OnAddEventListenerEventDetail>) {
    const { topicId } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onAddEventListener: metrics.onAddEventListener + 1,
      };
    });
  }

  function onPostMessage(e: CustomEvent<OnPostMessageEventDetail>) {
    const { topicId, payload } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        lastPayload: payload ?? null,
        onPostMessage: metrics.onPostMessage + 1,
      };
    });
  }

  function onCreateTopic(e: CustomEvent<OnCreateTopicEventDetail>) {
    const { topicId, jsonSchema } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        schema: jsonSchema,
        onCreateTopic: metrics.onCreateTopic + 1,
      };
    });
  }

  function addRunnelEventListener(
    eventName: DispatchEventName,
    eventListener: EventListener,
  ) {
    (window.top ?? window).addEventListener(eventName, eventListener);
  }
  function removeRunnelEventListener(
    eventName: DispatchEventName,
    eventListener: EventListener,
  ) {
    (window.top ?? window).removeEventListener(eventName, eventListener);
  }

  function register() {
    addRunnelEventListener(
      onRemoveEventListenerEventName,
      onRemoveEventListener as EventListener,
    );
    addRunnelEventListener(
      onAddEventListenerEventName,
      onAddEventListener as EventListener,
    );
    addRunnelEventListener(
      onPostMessageEventName,
      onPostMessage as EventListener,
    );
    addRunnelEventListener(
      onCreateTopicEventName,
      onCreateTopic as EventListener,
    );
  }

  function unregister() {
    removeRunnelEventListener(
      onRemoveEventListenerEventName,
      onRemoveEventListener as EventListener,
    );
    removeRunnelEventListener(
      onAddEventListenerEventName,
      onAddEventListener as EventListener,
    );
    removeRunnelEventListener(
      onPostMessageEventName,
      onPostMessage as EventListener,
    );
    removeRunnelEventListener(
      onCreateTopicEventName,
      onCreateTopic as EventListener,
    );
  }

  return { register, unregister };

  function updateStats(topicId: string, diff: (metrics: Metrics) => Metrics) {
    const old = { ...metrics };
    metrics[topicId] ??= initialTopicMetrics;
    metrics[topicId] = { ...diff(metrics[topicId]) };

    if (!deepEqual(old, metrics)) {
      callback(metrics);
    }
  }
}
