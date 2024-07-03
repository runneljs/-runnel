import type { TopicId } from "../primitive-types";

type UUID = string;
type Subscriber = (payload: any) => void;
export type Subscription = Map<UUID, Subscriber>;

export class SubscriptionStore extends Map<TopicId, Subscription> {
  // If `subscriber` is not set, it's considered as unsubscribing.
  update(topicId: TopicId, uuid: UUID, subscriber?: Subscriber): void {
    const subscribers = this.get(topicId)!;
    subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
    this.set(topicId, subscribers);
  }
  getOrCreate(topicId: TopicId): Subscription {
    return this.get(topicId) ?? new Map<UUID, Subscriber>();
  }
}
