import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { beforeAll, describe, expect, test, afterAll } from "bun:test";
import { setupReporter } from "./test-utils/setup-reporter";

const { setReport, reporter, observer } = setupReporter(import.meta.url);
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
    const button = screen.getByText("count is 0");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("count is 1")).toBeTruthy();
    });
  });

  test("expected publish/subscribe events are introduced", () => {
    expect(reportInMemory).toEqual({
      fullName: {
        subscribe: 1,
        publish: 0,
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
      },
      count: { subscribe: 1, publish: 1, schema: { type: "number" } },
    });
  });
});
