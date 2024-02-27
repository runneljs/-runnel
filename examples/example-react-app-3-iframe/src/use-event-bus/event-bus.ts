import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import { validator } from "mfe-event-bus-validator";
import {
  EventBusMetricPluginPayload,
  eventBusMetricPlugin,
} from "./event-bus-plugin";
import { Observable } from "./observer";

const observer = new Observable<EventBusMetricPluginPayload>();

const eventBus = createEventBus({
  deepEqual,
  payloadValidator: validator,
  space: window.parent, // Use the parent window as the space.
  plugins: {
    metricPlugin: eventBusMetricPlugin(
      (payload: EventBusMetricPluginPayload) => {
        observer.notify(payload);
      },
    ),
  },
});

export { eventBus, observer as metricsObserver };
