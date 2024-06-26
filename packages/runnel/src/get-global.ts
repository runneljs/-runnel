import type { GlobalType } from "./scope";

export function getGlobal(): GlobalType {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}
