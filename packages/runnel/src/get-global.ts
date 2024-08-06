import type { JsonSchema } from "./schema-manager";
import type { TopicId } from "./topic-name-to-id";

export type RunnelGlobals = {
  // Store schemas so we can validate schema and payload.
  schemaStoreMap?: Map<TopicId, JsonSchema>;
  // For new subscribers which subscribe to a topic already published.
  latestStateStoreMap?: Map<TopicId, unknown>;
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
  if (typeof global !== "undefined") {
    return global as unknown as GlobalType;
  }
  if (typeof self !== "undefined") {
    return self as unknown as GlobalType;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}
