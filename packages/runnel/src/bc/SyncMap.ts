type MessageType = "set" | "delete" | "clear";

export class SyncMap<K, V> extends Map<K, V> {
  private channel: BroadcastChannel;

  constructor(channelName: string) {
    super();
    this.channel = new BroadcastChannel(channelName);
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
      }
    });
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
