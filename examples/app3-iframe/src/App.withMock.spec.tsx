import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { registerTopic } from "./use-topic-subscription";

describe("App", () => {
  describe("On the first click", () => {
    let vitestMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vitestMock = vi.fn();
      const countTopic = registerTopic("count");
      countTopic.subscribe(vitestMock);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("counter increments when button is clicked", async () => {
      render(<App />);
      const button = screen.getByText("count is 0");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("count is 1")).toBeTruthy();
      });

      expect(vitestMock).toHaveBeenCalledWith(1);
      expect(vitestMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("On the second click", () => {
    let vitestMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vitestMock = vi.fn();
      const countTopic = registerTopic("count");
      countTopic.subscribe(vitestMock);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    test("counter increments when button is clicked", async () => {
      // The subscriber receives the latest data right away.
      expect(vitestMock).toHaveBeenCalledWith(1);
      expect(vitestMock).toHaveBeenCalledTimes(1);

      render(<App />);
      const button = screen.getByText("count is 1");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("count is 2")).toBeTruthy();
      });

      expect(vitestMock).toHaveBeenCalledWith(2);
      expect(vitestMock).toHaveBeenCalledTimes(2);
    });
  });
});
