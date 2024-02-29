import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import { createPlugin, type Metrics } from "mfe-event-bus-metric-plugin";
import { validator } from "mfe-event-bus-validator";
const { plugin, observer } = createPlugin(deepEqual);

const eventBus = createEventBus({
  deepEqual,
  payloadValidator: validator,
  space: window.parent, // Use the parent window as the space.
  plugins: {
    metricPlugin: plugin,
  },
});

export { eventBus, observer as metricsObserver, type Metrics };
