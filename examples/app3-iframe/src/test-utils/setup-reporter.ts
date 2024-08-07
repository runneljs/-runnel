import { createPlugin } from "@runnel/metric-plugin";
import { createReporter } from "@runnel/reporter";
import { validator } from "@runnel/validator";
import deepEqual from "deep-equal";
import { runnel } from "runneljs";

export function setupReporter(currentFileUrl: string) {
  const { setReport, reporter } = createReporter(currentFileUrl);
  const { register, observer } = createPlugin(deepEqual);
  const { registerTopic } = runnel("event-bus", deepEqual, validator);
  register();
  return { setReport, reporter, observer, registerTopic };
}
