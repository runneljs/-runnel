/**
 * This file is used to get the global object.
 * It is used to store the latest state store map. Newly attached subscribers will receive the latest payload of the topic.
 * @module
 */

export type RunnelGlobals = {
  // For new subscribers which subscribe to a topic already published.
  latestStateStoreMap?: Map<string, unknown>;
};

interface CustomWindow extends Window {
  __runnel: RunnelGlobals;
}
declare const window: CustomWindow;
export type GlobalType = CustomWindow;

export function getGlobal(): GlobalType {
  if (typeof window !== "undefined") {
    return (window.top ?? window) as unknown as GlobalType;
  }
  if (typeof globalThis !== "undefined") {
    return globalThis as unknown as GlobalType;
  }
  if (typeof self !== "undefined") {
    return self as unknown as GlobalType;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}
