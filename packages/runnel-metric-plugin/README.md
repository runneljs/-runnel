# Runnel Metric PlugIn

A plugin to aggregate the metrics of the local event bus.

This library is designed for [runneljs](https://www.npmjs.com/package/runneljs).

## Usage

```ts
const { plugin, subscribe } = createPlugin(deepEqual);
const eventBus = createEventBus({
  deepEqual,
  payloadValidator,
  pluginMap: new Map([[window.parent, [metricPlugin]]]), // When you want to observe the parent window. If the `scope` is smaller than the specified plugin scope, the specified plugin will not work.
  // pluginMap: new Map([[undefined, [plugin]]]), // When you want to observe the current event bus only.
});

...

// Example with React.useState
const [metrics, setMetrics] = useState();
subscribe(setMetrics);
```

## Data Type

### `Metrics`

It collects the number of publish/subscribe events called with the topics created via the `eventBus`.

```ts
type Metrics = Record<
  string,
  {
    onCreatePublish: number;
    onCreateSubscribe: number;
    schema: object;
    publish: any[];
    subscribe: any[];
  }
>;
```

### Example

#### Case: The `topic1` topic that has `{"type": "number"}` had one publish event with payload `100` but there are no subscribers

```json
{
  "topic1": {
    "onCreatePublish": 1,
    "publish": [100],
    "onCreateSubscribe": 0,
    "subscribe": [],
    "schema": { "type": "number" }
  }
}
```

#### Case: The `topic2` topic that has `{"type": "string"}` in its schema had one subscribe event but there are no publishers

```json
{
  "topic2": {
    "onCreatePublish": 0,
    "publish": [],
    "onCreateSubscribe": 1,
    "subscribe": [],
    "schema": { "type": "string" }
  }
}
```
