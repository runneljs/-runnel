import { useEffect, useState } from "react";
import { runnel } from "runneljs";

export type Schemas = {
  count: number;
  fullName: {
    firstName: string;
    lastName: string;
  };
};

const { registerTopic } = runnel<Schemas>();
export { registerTopic };

export function useTopicSubscription<T extends keyof Schemas & string>(
  topicName: T,
  initialState: Schemas[T],
) {
  const topic = registerTopic(topicName);
  const [state, setState] = useState<Schemas[T]>(initialState);
  useEffect(() => {
    const unsubscribe = topic.subscribe(setState);
    return () => unsubscribe();
  }, [topic]);
  return { state, topic };
}
