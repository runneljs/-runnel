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
    const button = screen.getByText("count is 0");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("count is 1")).toBeTruthy();
    });
  });

  // Schema info is decouple
  test("expected publish/subscribe events are introduced", () => {
    expect(reportInMemory).toEqual({
      fullName: {
        onCreateSubscribe: 1,
        onCreatePublish: 0,
        publish: [],
        subscribe: [],
      },
      count: {
        onCreateSubscribe: 1,
        onCreatePublish: 1,
        publish: [1],
        subscribe: [1],
      },
    });
  });
});
