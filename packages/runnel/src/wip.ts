export const plugin = (
  id: string,
  observer: Observable<{ type: "onSubscribe" | "onPublish"; topicId: string }>,
) => ({
  onPublish: function (topicId: string, payload: unknown): unknown {
    observer.notify({ type: "onPublish", topicId });
    return payload + `+${id}`;
  },
  onSubscribe: function (topicId: string, payload: unknown): unknown {
    observer.notify({ type: "onSubscribe", topicId });
    const regex = new RegExp(`\\+${id}$`);
    return (payload as string).replace(regex, "");
  },
});

export const pubsub = (plugins: ReturnType<typeof plugin>[]) => {
  const topicMap = new Map<string, Map<string, (payload: unknown) => void>>();
  const subChain = chain(
    [...plugins].reverse().map((plugin) => plugin.onSubscribe),
  );
  const pubChain = chain(plugins.map((plugin) => plugin.onPublish));

  // It can be treated as a plugin.
  const publish = (topicId: string, payload: unknown): void => {
    const subscribers = topicMap.get(topicId);
    if (subscribers) {
      subscribers.forEach((cb) => {
        cb(subChain(topicId, pubChain(topicId, payload)));
      });
    }
  };

  const subscribe = (topicId: string, cb: (payload: unknown) => void): void => {
    const subscriberMap =
      topicMap.get(topicId) ?? new Map<string, (payload: unknown) => void>();
    const uuid = Math.random().toString(36).substring(7);
    subscriberMap.set(uuid, cb);
    topicMap.set(topicId, subscriberMap);
  };

  return {
    publish,
    subscribe,
  };
};

type Fn = (id: string, payload: unknown) => unknown;
function chain(funcs: Fn[]): Fn {
  return (id: string, initialValue: unknown) => {
    return funcs.reduce((currentValue, currentFunction) => {
      return currentFunction(id, currentValue);
    }, initialValue);
  };
}

export class Observable<T> {
  private observers: Array<(data: T) => void>;
  constructor() {
    this.observers = [];
  }

  subscribe(func: (data: T) => void) {
    this.observers.push(func);
  }

  unsubscribe(func: (data: T) => void) {
    this.observers = this.observers.filter((observer) => observer !== func);
  }

  notify(data: T) {
    this.observers.forEach((observer) => observer(data));
  }
}
