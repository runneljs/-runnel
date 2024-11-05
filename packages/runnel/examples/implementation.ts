// @ts-nocheck
import { runnel } from "../src";
import type { Schemas } from "./Schema";

// Usage
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

const failedTopic = registerTopic(1); // not ok
