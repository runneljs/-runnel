import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import { createPlugin, type Metrics } from "mfe-event-bus-metric-plugin";
import { validator } from "mfe-event-bus-validator";
const { plugin, observer } = createPlugin(deepEqual);

const eventBus = createEventBus({
  deepEqual,
  payloadValidator: validator,
  scope: window.parent, // Use the parent window as the space.
  pluginMap: new Map([[window.parent, [plugin]]]),
  // plugins: [plugin], // When you want to observe the current event bus only.
});

export { eventBus, observer as metricsObserver, type Metrics };
