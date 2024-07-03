# @runnel/metric-plugin

This library is designed for [Runnel](https://docs.runnel.run/). Please visit [our documentation](https://docs.runnel.run/) and learn more.

## Usage

```ts
const { register, unregister, subscribe } = createPlugin(deepEqual);
const eventBus = createEventBus({
  deepEqual,
  payloadValidator,
});
register();
...

// Example with React.useState
const [metrics, setMetrics] = useState();
subscribe(setMetrics);
```

## Output Examples

### Case 1

- `topic1` with schema `{ "type": "number" }`.
- No subscribers.
- One publishing event with payload `100`.

```json
{
  "topic1": {
    "onPublishCreated": 1,
    "onPublish": 100,
    "onSubscribeCreated": 0,
    "onSubscribe": null
  }
}
```

### Case 2

- `topic2` with schema `{ "type": "string" }`.
- One subscriber.
- No publishing events.

```json
{
  "topic2": {
    "onPublishCreated": 0,
    "onPublish": null,
    "onSubscribeCreated": 1,
    "onSubscribe": null
  }
}
```
