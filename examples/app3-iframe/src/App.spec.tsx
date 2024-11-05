import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  test("counter increments when button is clicked", async () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /count is 0/i });
    expect(button).toBeTruthy();
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /count is 1/i })).toBeTruthy();
    });
  });
});
