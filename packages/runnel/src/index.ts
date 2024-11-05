import { getGlobal } from "./get-global";
import { createLogger } from "./logger";

type TopicId = string;

type Runnel<S> = {
  registerTopic: <T extends keyof S & string>(
    topicId: T,
  ) => {
    subscribe: (subscriber: (payload: S[T]) => void) => void;
    publish: (payload: S[T]) => void;
  };
};

export function runnel<S>(): Runnel<S> {
  const globalVar = getGlobal();
  globalVar.__runnel ??= {};
  const latestMap = (globalVar.__runnel.latestStateStoreMap ??= new Map<
    TopicId,
    unknown
  >());

  // T as TopicId, P as Payload, S as Schemas
  function registerTopic<T extends keyof S & string>(topicId: T) {
    const logger = createLogger<S>(topicId);
    logger.onCreateTopic();

    type P = S[T];
    return {
      subscribe: (subscriber: (payload: P) => void) => {
        const eventListener = (event: Event) => {
          const { detail } = event as CustomEvent;
          subscriber(detail);
        };
        globalVar.addEventListener(eventName(topicId), eventListener);
        logger.onAddEventListener();

        const latestPayload = latestMap.get(topicId) as P | undefined;
        if (latestPayload) {
          // As soon as a new subscriber is added, the subscriber should receive the latest payload.
          subscriber(latestPayload);
          logger.onPostMessage(latestPayload);
        }

        return function unsubscribe() {
          globalVar.removeEventListener(eventName(topicId), eventListener);
          logger.onRemoveEventListener();
        };
      },
      publish: (payload: P) => {
        globalVar.dispatchEvent(
          new CustomEvent(eventName(topicId), { detail: payload }),
        );
        logger.onPostMessage(payload);
        // Preserve the latest payload with the topicId.
        // So the newly registered topics can get the latest payload when they subscribe.
        latestMap.set(topicId, payload);
      },
    };
  }
  return { registerTopic };
}

function eventName(topicId: TopicId) {
  return `runnel:${topicId}`;
}
