import { createEventBusMetricPlugin, type Metrics } from "./metric-plugin";
import { Observable } from "./observable";

export function createPlugin(deepEqual: (a: any, b: any) => boolean) {
  const observer = new Observable<Metrics>();
  const plugin = createEventBusMetricPlugin(deepEqual, (metrics: Metrics) => {
    observer.notify(metrics);
  });
  const subscribe = (callback: (val: Metrics) => void) =>
    observer.subscribe(callback);

  return { plugin, subscribe };
}
