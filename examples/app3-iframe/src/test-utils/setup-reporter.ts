import { createPlugin } from "@runnel/metric-plugin";
import { createReporter } from "@runnel/reporter";
import { validator } from "@runnel/validator";
import deepEqual from "deep-equal";
import createEventBus from "runneljs";

export function setupReporter(currentFileUrl: string) {
  const { setReport, reporter } = createReporter(currentFileUrl);
  const { plugin, observer } = createPlugin(deepEqual);
  createEventBus({
    deepEqual,
    payloadValidator: validator,
    pluginMap: new Map([[window.parent, [plugin]]]),
  });
  return { setReport, reporter, observer };
}
