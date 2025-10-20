// CreateAccount.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CreateAccount from "../screens/CreateAccount";
import { createUserWithEmailAndPassword, sendEmailVerification } from "@firebase/auth";
import { setDoc } from "firebase/firestore";
import { Alert } from "react-native";

// Mock Firebase functions
jest.mock("@firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

// Mock FirebaseConfig
jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_AUTH: {},
  FIREBASE_DB: {},
}));

jest.spyOn(Alert, "alert");

describe("CreateAccount Screen", () => {
  const navigation = { navigate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders inputs and buttons", () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateAccount navigation={navigation} />
    );

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
    expect(getByText("Account verified? Login here")).toBeTruthy();
  });

  test("updates email and password inputs", () => {
    const { getByPlaceholderText } = render(<CreateAccount navigation={navigation} />);
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "Password1!");

    expect(emailInput.props.value).toBe("test@example.com");
    expect(passwordInput.props.value).toBe("Password1!");
  });

  test("shows error if email is invalid", () => {
    const { getByPlaceholderText, getByText } = render(<CreateAccount navigation={navigation} />);
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "invalid-email");
    expect(getByText("Invalid email address")).toBeTruthy();
  });

  test("shows error if password is invalid", () => {
    const { getByPlaceholderText, getByText } = render(<CreateAccount navigation={navigation} />);
    const passwordInput = getByPlaceholderText("Password");

    fireEvent.changeText(passwordInput, "short");
    expect(getByText(/Password must be at least 8 characters long/i)).toBeTruthy();
  });

  test("alerts if terms not accepted", () => {
    const { getByText } = render(<CreateAccount navigation={navigation} />);
    fireEvent.press(getByText("Sign Up"));
    expect(Alert.alert).toHaveBeenCalledWith("You must accept terms and conditions.");
  });

  test("handles successful sign up", async () => {
    const mockUser = { uid: "123", email: "test@example.com" };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: mockUser });
    (sendEmailVerification as jest.Mock).mockResolvedValueOnce(undefined);
    (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText, getByRole } = render(<CreateAccount navigation={navigation} />);

    // Accept terms
    fireEvent.press(getByText("⬜️"));

    // Enter valid inputs
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password1!");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, "test@example.com", "Password1!");
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Verification Sent",
        "A verification email has been sent to your email address. Please check your inbox!"
      );
    });
  });

  test("navigates back to login", () => {
    const { getByText } = render(<CreateAccount navigation={navigation} />);
    fireEvent.press(getByText("Account verified? Login here"));
    expect(navigation.navigate).toHaveBeenCalledWith("Login");
  });
});
