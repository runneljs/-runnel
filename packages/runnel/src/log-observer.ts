import { getGlobal } from "./get-global";
import { LogEventNames as InternalLogEventNames } from "./logger";

export const enum LogEventNames {
  onCreateTopic = "onCreateTopic",
  onAddEventListener = "onAddEventListener",
  onPostMessage = "onPostMessage",
  onRemoveEventListener = "onRemoveEventListener",
}

type CustomEventDetail<T extends string, P> = {
  topicId: T;
  payload: P;
};

type Log = {
  name: LogEventNames;
  detail: CustomEventDetail<string, unknown>;
};

export function createLogObserver(logger: (log: Log) => void) {
  const globalVar = getGlobal();
  const listeners: [InternalLogEventNames, (event: Event) => void][] = [
    [InternalLogEventNames.onCreateTopic, onCreateListener],
    [InternalLogEventNames.onAddEventListener, onAddEventListenerListener],
    [InternalLogEventNames.onPostMessage, onPostMessageListener],
    [
      InternalLogEventNames.onRemoveEventListener,
      onRemoveEventListenerListener,
    ],
  ];
  listeners.forEach(([event, listener]) => {
    globalVar.addEventListener(event, listener);
  });

  return function unsubscribe() {
    listeners.forEach(([event, listener]) => {
      globalVar.removeEventListener(event, listener);
    });
  };

  function onCreateListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string, never>>;
    logger({ name: LogEventNames.onCreateTopic, detail });
  }
  function onAddEventListenerListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string, never>>;
    logger({ name: LogEventNames.onAddEventListener, detail });
  }
  function onPostMessageListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string, unknown>>;
    logger({ name: LogEventNames.onPostMessage, detail });
  }
  function onRemoveEventListenerListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string, never>>;
    logger({ name: LogEventNames.onRemoveEventListener, detail });
  }
}
