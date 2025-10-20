// ForgetPassword.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ForgetPassword from "../screens/ForgetPassword";
import { sendPasswordResetEmail } from "@firebase/auth";
import { Alert } from "react-native";

// Mock Firebase functions
jest.mock("@firebase/auth", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_AUTH: {},
}));

jest.spyOn(Alert, "alert");

describe("ForgetPassword Screen", () => {
  const navigation = { navigate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input and buttons", () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgetPassword navigation={navigation} />
    );
    expect(getByPlaceholderText("Enter your email")).toBeTruthy();
    expect(getByText("Send Reset Link")).toBeTruthy();
    expect(getByText("Back to Login")).toBeTruthy();
  });

  test("updates email input", () => {
    const { getByPlaceholderText } = render(
      <ForgetPassword navigation={navigation} />
    );
    const input = getByPlaceholderText("Enter your email");
    fireEvent.changeText(input, "test@example.com");
    expect(input.props.value).toBe("test@example.com");
  });

  test("calls sendPasswordResetEmail and shows success alert", async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText } = render(
      <ForgetPassword navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter your email"), "test@example.com");
    fireEvent.press(getByText("Send Reset Link"));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com"
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Password Reset",
        "Check your email for a reset link!"
      );
    });
  });

  test("shows error alert for invalid email", async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce({ code: "auth/invalid-email" });

    const { getByText, getByPlaceholderText } = render(
      <ForgetPassword navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Enter your email"), "invalid-email");
    fireEvent.press(getByText("Send Reset Link"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Email",
        "Please enter a valid email address."
      );
    });
  });

  test("navigates back to Login", () => {
    const { getByText } = render(<ForgetPassword navigation={navigation} />);
    fireEvent.press(getByText("Back to Login"));
    expect(navigation.navigate).toHaveBeenCalledWith("Login");
  });
});
