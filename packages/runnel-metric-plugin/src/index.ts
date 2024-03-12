import {
  createEventBusMetricPlugin,
  type MetricsRecord,
} from "./metric-plugin";
import { Observable } from "./observable";
export { type MetricsRecord as Metrics } from "./metric-plugin";

export function createPlugin(deepEqual: (a: any, b: any) => boolean) {
  const observer = new Observable<MetricsRecord>();
  const plugin = createEventBusMetricPlugin(
    deepEqual,
    (metrics: MetricsRecord) => {
      observer.notify(metrics);
    },
  );
  return { plugin, observer };
}
