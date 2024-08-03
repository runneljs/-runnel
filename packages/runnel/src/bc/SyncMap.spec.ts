import {
  mockBroadcastChannel,
  resetMockBroadcastChannel,
} from "../test-utils/mock-broadcast-channel";
import { SyncMap } from "./SyncMap"; // Adjust the import path as needed

describe("SyncMap", () => {
  const channelName = "test-channel";
  let map1: SyncMap<string, any>;
  let map2: SyncMap<string, any>;
  let rawChannel: BroadcastChannel;
  beforeAll(() => {
    mockBroadcastChannel();
  });

  afterAll(() => {
    resetMockBroadcastChannel();
  });

  beforeEach(() => {
    // Create two instances of SyncMap
    map1 = new SyncMap<string, any>(channelName);
    map2 = new SyncMap<string, any>(channelName);
    rawChannel = new BroadcastChannel(channelName);
  });

  it("should set and get values correctly", () => {
    map1.set("key1", "value1");
    expect(map1.get("key1")).toBe("value1");
    expect(map2.get("key1")).toBe("value1");
  });

  it("should delete values correctly", () => {
    map1.set("key1", "value1");
    map1.delete("key1");
    expect(map1.get("key1")).toBeUndefined();
    expect(map2.get("key1")).toBeUndefined();
  });

  it("should clear all values correctly", () => {
    map1.set("key1", "value1");
    map1.set("key2", "value2");
    map2.set("key3", "value3");

    map1.clear();
    expect(map1.size).toBe(0);
    expect(map2.size).toBe(0);
  });
});
