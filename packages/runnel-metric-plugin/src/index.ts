import { createEventBusMetricPlugin, type Metrics } from "./metric-plugin";
import { Observable } from "./observable";
export { type Metrics } from "./metric-plugin";

export function createPlugin(deepEqual: (a: any, b: any) => boolean) {
  const observer = new Observable<Metrics>();
  const plugin = createEventBusMetricPlugin(deepEqual, (metrics: Metrics) => {
    observer.notify(metrics);
  });
  return { plugin, observer };
}
