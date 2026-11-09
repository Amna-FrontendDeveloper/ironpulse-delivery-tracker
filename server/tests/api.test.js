import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the IronPulse welcome page", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", {
      name: /ironpulse delivery tracker/i,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("link", { name: /driver sign in/i })
  ).toBeInTheDocument();
});