# Runnel

An Event Bus library designed for Micro-Frontend Applications.

> Hugely Inspired by [@trutoo/event-bus](https://www.npmjs.com/package/@trutoo/event-bus)

## Installation

`npm install runneljs`

## Communication Challenges in Micro-Frontends

In microservice and micro-frontend development, the concept of "autonomy" is pivotal. Each micro-frontend, or fragment, is developed and deployed independently. However, these autonomous fragments must still communicate with one another. The Publish/Subscribe (PubSub) pattern is a popular method for facilitating this communication while maintaining decoupling.

### PubSub Pattern: Opportunities and Challenges

The PubSub pattern is a mainstay in software architecture due to its ability to keep applications loosely coupled. However, it's not without its drawbacks.

#### Semantic Coupling

Once a topic in PubSub is established, altering its data schema becomes challenging. Publishers are constrained in their ability to freely modify the schema of the data they emit. A common workaround is to version the payload schema, providing subscribers time to adapt to new versions.

#### Unknown Publisher-Subscriber Relationships

A notable limitation of this pattern is the lack of awareness between publishers and subscribers. Publishers are unaware of the subscribers' schema compatibility and continue to send messages regardless of whether there are subscribers. This situation is reciprocal for subscribers.

## Proposed Solutions

### Version Information in Topic Registration

Incorporating version information as an optional parameter in the topic registration API can help manage schema changes.

### Enforcing Schema Declaration

Drawing inspiration from [@trutoo/event-bus](https://www.npmjs.com/package/@trutoo/event-bus), topic creation can mandate a schema declaration. This ensures uniformity across topics sharing the same ID and facilitates payload validation against the defined schema.

## Usage

### Bring Your Own Libraries

TODO: How to give deepEqual and validator

### Code

TODO: Add code snippet. Maybe with React.

## Example

TODO: Add screenshots

TODO: Require Bun

## Resource

- https://increment.com/frontend/micro-frontends-in-context/
- https://oskari.io/blog/event-bus-micro-frontend
- https://lucamezzalira.com/2022/03/01/the-micro-frontends-future/
- https://single-spa.js.org/docs/faq/#how-can-i-share-application-state-between-applications
- https://youtu.be/BuRB3djraeM?si=YgQqYaBvmdLoTAKN
- https://youtu.be/Wn1Cj7785i8?si=9Mp5f6IDSWaHPg-U
