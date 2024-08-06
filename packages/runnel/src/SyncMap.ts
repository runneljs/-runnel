type MessageType = "request-sync" | "sync" | "set" | "delete" | "clear";
import { DualBroadcastChannel } from "./DualBroadcastChannel";

export class SyncMap<K, V> extends Map<K, V> {
  private channel: DualBroadcastChannel;

  constructor(channelName: string) {
    super();
    this.channel = new DualBroadcastChannel(channelName);
    this.channel.addEventListener("message", (event) => {
      const { type, key, value } = event.data as {
        type: MessageType;
        key?: K;
        value?: V;
      };
      switch (type) {
        case "set":
          if (!key || !value) return;
          super.set(key, value);
          break;
        case "delete":
          if (!key) return;
          super.delete(key);
          break;
        case "clear":
          super.clear();
          break;
        case "request-sync":
          this.channel.postMessage({
            type: "sync",
            data: Array.from(this.entries()),
          });
          break;
        case "sync":
          event.data.data.forEach(([key, value]: [K, V]) => {
            super.set(key, value);
          });
          break;
      }
    });

    this.channel.exclusivePostMessage({ type: "request-sync" });
  }

  set(key: K, value: V): this {
    super.set(key, value);
    this.channel.postMessage({ type: "set", key, value });
    return this;
  }

  delete(key: K): boolean {
    const result = super.delete(key);
    this.channel.postMessage({ type: "delete", key });
    return result;
  }

  clear(): void {
    super.clear();
    this.channel.postMessage({ type: "clear" });
  }
}
