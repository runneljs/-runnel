// https://www.npmjs.com/package/vitest-broadcast-channel-mock
import { vi, type Mock } from "vitest";

type BroadcastChannelMock = Omit<
  Record<keyof BroadcastChannel, Mock>,
  "name"
> & {
  name: string;
};

const mockChannels = new Map<string, BroadcastChannelMock>();

export const mockBroadcastChannel = () => {
  vi.stubGlobal(
    "BroadcastChannel",
    vi.fn((key: string) => {
      const channel = mockChannels.get(key) ?? {
        name: key,
        dispatchEvent: vi.fn(),
        onmessage: vi.fn(),
        onmessageerror: vi.fn(),
        postMessage: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      channel.onmessage.mockImplementation((messageEvent: MessageEvent) => {
        channel.addEventListener.mock.calls.forEach((call) => {
          call[1]({ data: messageEvent.data });
        });
      });
      channel.postMessage.mockImplementation((message: unknown) => {
        channel.addEventListener.mock.calls.forEach((call) => {
          call[1]({ data: message });
        });
      });
      mockChannels.set(key, channel);
      return channel;
    }),
  );

  return mockChannels;
};

export const resetMockBroadcastChannel = () => {
  mockChannels.clear();
  vi.restoreAllMocks();
};
