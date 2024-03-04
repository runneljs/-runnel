import type {
  Subscriber,
  Subscription,
  TopicId,
  UUID,
} from "./primitive-types";

/**
 * This may be redundant. I want to hide "subscribers".
 */
export class SubscriptionStore extends Map<TopicId, Subscription> {
  update(topicId: TopicId, uuid: UUID, subscriber?: Subscriber) {
    const subscribers = this.get(topicId)!;
    subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
    this.set(topicId, subscribers);
  }
}
