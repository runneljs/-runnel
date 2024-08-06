// import MockBroadcastChannel from "./test-utils/MockBroadcastChannel";
// Object.defineProperty(window, "BroadcastChannel", {
//   value: MockBroadcastChannel,
// });

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { setupReporter } from "./test-utils/setup-reporter";

const { setReport, reporter, observer } = setupReporter(`file://${__filename}`);
let reportInMemory = {};

describe("App", () => {
  beforeAll(() => {
    observer.subscribe(setReport);
    observer.subscribe((data) => {
      reportInMemory = data;
    });
  });

  afterAll(() => {
    reporter();
  });

  test("counter increments when button is clicked", async () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /count is 0/i });
    expect(button).toBeTruthy();
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /count is 1/i })).toBeTruthy();
    });
  });

  // Schema info is decouple
  test("expected publish/subscribe events are introduced", () => {
    expect(reportInMemory).toEqual({
      fullName: {
        onAddEventListener: 1,
        onRemoveEventListener: 1,
        schema: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
          required: ["firstName", "lastName"],
          additionalProperties: false,
          $schema: "http://json-schema.org/draft-07/schema#",
        },
        onCreateTopic: 1,
        lastPayload: null,
        onPostMessage: 0,
      },
      count: {
        schema: {
          type: "number",
        },
        onAddEventListener: 1,
        onRemoveEventListener: 1,
        onCreateTopic: 1,
        lastPayload: 1,
        onPostMessage: 1,
      },
    });
  });
});
