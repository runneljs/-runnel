import type {
  Subscriber,
  Subscription,
  TopicId,
  UUID,
} from "../primitive-types";

export class SubscriptionStore extends Map<TopicId, Subscription> {
  // If `subscriber` is not set, it's considered as unsubscribing.
  update(topicId: TopicId, uuid: UUID, subscriber?: Subscriber): void {
    const subscribers = this.get(topicId)!;
    subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
    this.set(topicId, subscribers);
  }
}
