# @runnel/metric-plugin

This library is designed for [Runnel](https://docs.runnel.run/). Please visit [our documentation](https://docs.runnel.run/) and learn more.

## Usage

```ts
const { plugin, subscribe } = createPlugin(deepEqual);
const eventBus = createEventBus({
  deepEqual,
  payloadValidator,
  pluginMap: new Map([[window, [metricPlugin]]]), // To observe the window. If the `scope` is smaller than the specified plugin scope, the specified plugin will not function.
});

...

// Example with React.useState
const [metrics, setMetrics] = useState();
subscribe(setMetrics);
```

## Output Examples

### Case 1

- `topic1` with schema `{ "type": "number" }`.
- No subscribers.
- One publish event with payload `100`.

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

### Case 2

- `topic2` with schema `{ "type": "string" }`.
- One subscriber.
- No publish events.

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
