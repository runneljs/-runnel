import type { Scope } from "./scope";

export function getGlobal(): Scope {
  if (typeof window !== "undefined") {
    return window as Scope;
  }
  if (typeof global !== "undefined") {
    return global as Scope;
  }
  if (typeof self !== "undefined") {
    return self as Scope;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}
