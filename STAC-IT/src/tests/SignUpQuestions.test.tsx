import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SignUpQuestions from "../screens/SignUpQuestions";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import { setDoc, doc } from "firebase/firestore";

// Mock Firebase imports
jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_AUTH: { currentUser: { uid: "testUser" } },
  FIREBASE_DB: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(),
}));


// Mock navigation
const mockNavigation: any = {
  navigate: jest.fn(),
};

describe("SignUpQuestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (setDoc as jest.Mock).mockResolvedValue(true);
  });

  it("renders input fields and buttons", () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpQuestions navigation={mockNavigation} />
    );

    expect(getByPlaceholderText("Enter your full name")).toBeTruthy();
    expect(getByText("Submit")).toBeTruthy();
    expect(getByText("Go Back")).toBeTruthy();
    expect(getByText("Why are we asking you this?")).toBeTruthy();
  });

  it("shows alert when full name is empty", () => {
    const alertMock = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<SignUpQuestions navigation={mockNavigation} />);

    fireEvent.press(getByText("Submit"));

    expect(alertMock).toHaveBeenCalledWith('Error', 'Please fill out all the fields.');
    alertMock.mockRestore();
  });

  it("submits data if user is logged in and age >=18", async () => {
    const alertMock = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <SignUpQuestions navigation={mockNavigation} />
    );

    // Fill in valid full name
    fireEvent.changeText(getByPlaceholderText("Enter your full name"), "John Doe");

    // Simulate date selection via DateTimePicker
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    // Open date picker by pressing the displayed date
    fireEvent.press(getByText(new Date().toLocaleDateString()));

    // Simulate user selecting date
    fireEvent(getByTestId("date-picker"), "onChange", {
      nativeEvent: { timestamp: eighteenYearsAgo.getTime() },
    }, eighteenYearsAgo);

    // Confirm the date
    fireEvent.press(getByText("Done"));

    // Press submit
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
            fullName: "John Doe",
            birthDate: expect.any(String),
             }),
        { merge: true }
      );
      expect(mockNavigation.navigate).toHaveBeenCalledWith("MainTabs");
    });

    alertMock.mockRestore();
  });

  it("navigates back on 'Go Back' button press", () => {
    const { getByText } = render(<SignUpQuestions navigation={mockNavigation} />);
    fireEvent.press(getByText("Go Back"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Login");
  });

  it("shows alert info when 'Why are we asking you this?' pressed", () => {
    const alertMock = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<SignUpQuestions navigation={mockNavigation} />);
    fireEvent.press(getByText("Why are we asking you this?"));

    expect(alertMock).toHaveBeenCalledWith(
      'Why are we asking you this?',
      expect.any(String),
      [{ text: 'OK' }]
    );

    alertMock.mockRestore();
  });
});
