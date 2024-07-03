import { topicNameToId } from "./topic-name-to-id";

describe("topicNameToId", () => {
  test("should convert a topic name to an id", () => {
    expect(topicNameToId("skywalker")).toBe("skywalker");
  });

  test("should convert a topic name to an id", () => {
    expect(topicNameToId("skywalker", -1)).toBe("skywalker");
  });

  test("should convert a topic name to an id with a version", () => {
    expect(topicNameToId("skywalker", 1)).toBe("skywalker@1");
  });
});
