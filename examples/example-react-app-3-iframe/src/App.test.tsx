import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { beforeAll, describe, expect, test, afterAll } from "bun:test";
import { createReporter } from "mfe-event-bus-reporter";

const { setReport, reporter } = createReporter(import.meta.url);
import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import { createPlugin } from "mfe-event-bus-metric-plugin";
import { validator } from "mfe-event-bus-validator";
const { plugin, observer } = createPlugin(deepEqual);
createEventBus({
  deepEqual,
  payloadValidator: validator,
  plugins: {
    metricPlugin: plugin,
  },
});

describe("App", () => {
  beforeAll(() => {
    observer.subscribe(setReport);
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
});
