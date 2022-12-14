import React from "react";
import { render, screen } from "@testing-library/react";
import AuthButton from "./AuthButton";

describe("AuthButton", () => {
  it("should render a card", () => {
    render(
      <AuthButton icon="google" isCard={true}>
        Sign in
      </AuthButton>,
    );

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByLabelText("google icon")).toBeInTheDocument();
  });

  it("should render a link", () => {
    render(<AuthButton>Sign in</AuthButton>);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });
});
