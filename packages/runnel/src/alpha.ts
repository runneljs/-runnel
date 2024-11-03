import { getGlobal } from "./get-global";

type TopicId = string;
function dispatchOnCreateTopic(topicId: TopicId) {}
function dispatchOnAddEventListener(topicId: TopicId) {}
function dispatchOnPostMessage(topicId: TopicId, payload: unknown) {}
function dispatchOnRemoveEventListener(topicId: TopicId) {}

function runnel<S>() {
  const globalVar = getGlobal();
  globalVar.__runnel ??= {};
  const latestMap = (globalVar.__runnel.latestStateStoreMap ??= new Map<
    TopicId,
    unknown
  >());

  // T as TopicId, P as Payload, S as Schemas
  function registerTopic<T extends keyof S & string>(topicId: T) {
    type P = S[T];
    dispatchOnCreateTopic(topicId);
    return {
      subscribe: (subscriber: (payload: P) => void) => {
        const eventListener = (event: Event) => {
          const { detail } = event as CustomEvent;
          subscriber(detail);
        };
        globalVar.addEventListener(topicId, eventListener);
        dispatchOnAddEventListener(topicId);
        const latestPayload = latestMap.get(topicId) as P | undefined;
        if (latestPayload) {
          // As soon as a new subscriber is added, the subscriber should receive the latest payload.
          subscriber(latestPayload);
          dispatchOnPostMessage(topicId, latestPayload);
        }

        return function unsubscribe() {
          globalVar.removeEventListener(topicId, eventListener);
          dispatchOnRemoveEventListener(topicId);
        };
      },
      publish: (payload: P) => {
        globalVar.dispatchEvent(new CustomEvent(topicId, { detail: payload }));
        dispatchOnPostMessage(topicId, payload);
        // Preserve the latest payload with the topicId.
        // So the newly registered topics can get the latest payload when they subscribe.
        latestMap.set(topicId, payload);
      },
    };
  }
  return { registerTopic };
}

// TODO: Auto-generate the schemas.
type Schemas = {
  test: string;
  "test@1": number;
  testObj: {
    foo: string;
  };
};
const { registerTopic } = runnel<Schemas>();
const topic = registerTopic("test");
topic.publish("string"); // ok
topic.subscribe((data) => {
  console.log("test", data);
});
topic.publish(1); // not ok
topic.publish(true); // not ok
topic.publish({ foo: "bar" }); // not ok

const topicObj = registerTopic("testObj");
topicObj.publish({ foo: "bar" }); // ok
topicObj.publish("string"); // not ok
topicObj.subscribe((data) => {
  console.log("testObj", data);
});
const topicVersioned = registerTopic("test@1");
topicVersioned.publish(1); // ok
topicVersioned.subscribe((data) => {
  console.log("test@1", data);
});
