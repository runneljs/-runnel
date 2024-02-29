import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import { createPlugin } from "mfe-event-bus-metric-plugin";
import { createReporter } from "mfe-event-bus-reporter";
import { validator } from "mfe-event-bus-validator";

export function setupReporter(currentFileUrl: string) {
  const { setReport, reporter } = createReporter(currentFileUrl);
  const { plugin, observer } = createPlugin(deepEqual);
  createEventBus({
    deepEqual,
    payloadValidator: validator,
    plugins: [[window.parent, [plugin]]],
  });
  return { setReport, reporter, observer };
}
