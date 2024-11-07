/**
 * This file is used to observe the log events.
 * It is optional to use this file. Import this file with `import { createLogObserver } from "runneljs/log-observer";`
 * @module
 */

import { getGlobal } from "./get-global";
import { LogEventNames as InternalLogEventNames } from "./logger";

/**
 * The log event names.
 */
export const enum LogEventNames {
  onCreateTopic = "onCreateTopic",
  onAddEventListener = "onAddEventListener",
  onPostMessage = "onPostMessage",
  onRemoveEventListener = "onRemoveEventListener",
}

type CustomEventDetail<T extends string> = {
  topicId: T;
};

type Log = {
  name: LogEventNames;
  detail: CustomEventDetail<string>;
};

/**
 * Create a log observer.
 * @param logger - The logger function. The function should take an object with `name` and `detail` properties as an argument.
 * @returns A function to unsubscribe the log observer.
 *
 * @example
 * ```ts
 * createLogObserver((log) => {
 *   console.log(log.name, log.detail.topicId);
 * });
 * ```
 */
export function createLogObserver(logger: (log: Log) => void): () => void {
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
    const { detail } = event as CustomEvent<CustomEventDetail<string>>;
    logger({ name: LogEventNames.onCreateTopic, detail });
  }
  function onAddEventListenerListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string>>;
    logger({ name: LogEventNames.onAddEventListener, detail });
  }
  function onPostMessageListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string>>;
    logger({ name: LogEventNames.onPostMessage, detail });
  }
  function onRemoveEventListenerListener(event: Event) {
    const { detail } = event as CustomEvent<CustomEventDetail<string>>;
    logger({ name: LogEventNames.onRemoveEventListener, detail });
  }
}
