import { SubscriptionStore } from "./SubscriptionStore";

describe("createSubscriptionStore", () => {
  let store: SubscriptionStore;
  const topicId = "topic-id";
  const subscription = new Map();
  beforeEach(() => {
    store = new SubscriptionStore();
    store.set(topicId, subscription);
  });
  describe("update", () => {
    test("add", () => {
      const uuid = "uuid";
      const subscriber = () => {};
      store.update(topicId, uuid, subscriber);
      expect(store.get(topicId)).toBe(subscription.set(uuid, subscriber));
    });
    test("remove", () => {
      const uuid = "uuid";
      store.update(topicId, uuid);
      expect(store.get(topicId)?.size).toBe(0);
    });
  });
});
