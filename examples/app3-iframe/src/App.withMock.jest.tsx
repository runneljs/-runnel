import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { setupReporter } from "./test-utils/setup-reporter";

const { registerTopic } = setupReporter(`file://${__filename}`);

describe("App", () => {
  describe("On the first click", () => {
    let jestMock: jest.Mock;

    beforeEach(() => {
      jestMock = jest.fn();
      const countTopic = registerTopic<number>("count", { type: "number" });
      countTopic.subscribe(jestMock);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("counter increments when button is clicked", async () => {
      render(<App />);
      const button = screen.getByText("count is 0");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("count is 1")).toBeTruthy();
      });

      expect(jestMock).toHaveBeenCalledWith(1);
      expect(jestMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("On the second click", () => {
    let jestMock: jest.Mock;

    beforeEach(() => {
      jestMock = jest.fn();
      const countTopic = registerTopic<number>("count", { type: "number" });
      countTopic.subscribe(jestMock);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("counter increments when button is clicked", async () => {
      // The subscriber receives the latest data right away.
      expect(jestMock).toHaveBeenCalledWith(1);
      expect(jestMock).toHaveBeenCalledTimes(1);

      render(<App />);
      const button = screen.getByText("count is 1");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("count is 2")).toBeTruthy();
      });

      expect(jestMock).toHaveBeenCalledWith(2);
      expect(jestMock).toHaveBeenCalledTimes(2);
    });
  });
});
