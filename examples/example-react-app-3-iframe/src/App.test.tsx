import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { beforeAll, describe, expect, test, afterAll } from "bun:test";
import { setupReporter } from "./test-utils/setup-reporter";

const { setReport, reporter, observer } = setupReporter(import.meta.url);

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
