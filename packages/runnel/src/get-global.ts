import type { GlobalType } from "./scope";

export function getGlobal(): GlobalType {
  if (typeof window !== "undefined") {
    return window as unknown as GlobalType;
  }
  if (typeof global !== "undefined") {
    return global as unknown as GlobalType;
  }
  if (typeof self !== "undefined") {
    return self as unknown as GlobalType;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}
