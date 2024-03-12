import { createPlugin } from "@runnel/metric-plugin";
import { createReporter } from "@runnel/reporter";
import { validator } from "@runnel/validator";
import deepEqual from "deep-equal";
import { createEventBus } from "runneljs";

export function setupReporter(currentFileUrl: string) {
  const { setReport, reporter } = createReporter(currentFileUrl);
  const { plugin, observer } = createPlugin(deepEqual);
  createEventBus({
    deepEqual,
    payloadValidator: validator,
    pluginMap: new Map().set(window.parent, [
      plugin,
      {
        publish: (id: string, payload: unknown) => {
          console.log(`[${id}] publish ${payload}`);
          return payload;
        },
        onCreatePublish: (id: string) => {
          console.log(`[${id}] onCreatePublish`);
        },
      },
    ]),
    scope: window.parent,
  });
  return { setReport, reporter, observer };
}
