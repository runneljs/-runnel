# Runnel: The Micro-Frontend Event Bus Library

[Runnel](https://docs.runnel.run/) is an event bus library specifically tailored for the dynamic world of Micro-Frontend Applications. It aims to bring you seamless communication across various fragments of your application. It's greatly inspired by [@trutoo/event-bus](https://www.npmjs.com/package/@trutoo/event-bus), inheriting its best features while adding some functionalities and flexibilities tailored for micro-frontend architectures.

## Communication Challenges in Micro-Frontends

In microservice and micro-frontend development, the concept of "autonomy" is pivotal. Each micro-frontend, or fragment, is developed and deployed independently. However, these autonomous fragments must still communicate with one another. The Publish/Subscribe (PubSub) pattern is a popular method for facilitating this communication while maintaining decoupling.

### PubSub Pattern: Opportunities and Challenges

The PubSub pattern is a mainstay in software architecture due to its ability to keep applications loosely coupled. However, it's not without its drawbacks.

#### Unknown Publisher-Subscriber Relationships

A notable limitation of this pattern is the lack of awareness between publishers and subscribers. Publishers are unaware of the subscribers' schema compatibility and continue to send messages regardless of whether there are subscribers. This situation is reciprocal for subscribers.

#### Semantic Coupling

Once a topic in PubSub is established, altering its data schema becomes challenging. Publishers are constrained in their ability to freely modify the schema of the data they emit. A common workaround is to version the payload schema, providing subscribers time to adapt to new versions.

## Proposed Solutions

### Enforcing Schema Declaration

Drawing inspiration from [@trutoo/event-bus](https://www.npmjs.com/package/@trutoo/event-bus), topic creation mandates a schema declaration. This ensures uniformity across topics sharing the same ID and facilitates payload validation against the defined schema.

```ts
import jsonSchema from "example-schema-definition.json";

const exampleTopic = registerTopic<object>("example", jsonSchema);
```

### Version Information in Topic Registration

Incorporating version information as an optional parameter in the topic registration API can help manage schema changes.

```ts
const exampleTopic = registerTopic<string>(
  "example",
  {
    type: "string",
  },
  { version: 1 },
);
```

## Explore the Documentation

Please visit [our documentation](https://docs.runnel.run/) and learn more.
