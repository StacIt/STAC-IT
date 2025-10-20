import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreateStack from "../screens/CreateStack";

// Mocking StacForm component
jest.mock("../components/StacForm", () => {
    const React = require("react");
    const { Text } = require("react-native");
  return ({ visible }: { visible: boolean }) => {
    return visible ? <Text>StacForm Modal</Text> : null;
  };
});


describe("CreateStack Screen", () => {
  test("Renders Create STAC button", () => {
    const { getByText } = render(<CreateStack navigation={{ navigate: jest.fn() }} />);
    expect(getByText("Create STAC")).toBeTruthy();
  });

  test("Shows StacForm modal when button is pressed", () => {
    const { getByText, queryByText } = render(<CreateStack navigation={{ navigate: jest.fn() }} />);

    // Modal hidden initially
    expect(queryByText("StacForm Modal")).toBeNull();

    // Press the button
    fireEvent.press(getByText("Create STAC"));

    // Modal appears now
    expect(getByText("StacForm Modal")).toBeTruthy();
  });
});
