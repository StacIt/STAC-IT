import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { setDoc, doc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from "../../FirebaseConfig";
import StacForm from "../components/StacForm";

// Polyfill setImmediate for Jest environment
if (typeof setImmediate === "undefined") {
  global.setImmediate = (fn: Function, ...args: any[]) => setTimeout(fn, 0, ...args);
}

// --- Mocks ---
jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_DB: {},
  FIREBASE_AUTH: { currentUser: { uid: "testUser" } },
}));

jest.mock("firebase/firestore", () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock("expo-sms", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  sendSMSAsync: jest.fn().mockResolvedValue({ result: "sent" }),
}));

// Mock backend function
jest.mock("../components/StacForm", () => {
  const original = jest.requireActual("../components/StacForm");
  return {
    __esModule: true,
    ...original,
    callBackendModel: jest.fn().mockResolvedValue({
      preferences: ["Mock pref"],
      options: [],
      descriptions: [],
      locations: [],
      preferenceTimings: [],
    }),
  };
});

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("StacForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("submits valid form and saves data to Firebase", async () => {
    (setDoc as jest.Mock).mockResolvedValue(true);

    const { getByText, getByPlaceholderText, getByTestId } = render(<StacForm />);


    // Fill all required fields
    fireEvent.changeText(getByPlaceholderText("STAC Name"), "Soccer at the park");
    fireEvent.changeText(getByPlaceholderText("City"), "Stamford");
    fireEvent.changeText(getByPlaceholderText("State (e.g., CA)"), "CT");

    fireEvent.changeText(getByTestId("startHourInput"), "08");
    fireEvent.changeText(getByTestId("startMinuteInput"), "00");
    fireEvent.press(getByTestId("AM-Button"));

    fireEvent.changeText(getByTestId("endHourInput"), "05");
    fireEvent.changeText(getByTestId("endMinuteInput"), "00");
    fireEvent.press(getByTestId("PM-Button"));


    // Set number of people
    // If you use a modal picker, you can directly set state if needed
    // Otherwise, simulate pressing a number
    fireEvent.press(getByText("Number of People (required)"));
    fireEvent.press(getByText("3")); // select 3 people

    // Set at least one activity
    fireEvent.changeText(getByPlaceholderText("Activity 1 (e.g., Grab a coffee)"), "Soccer");

    // Submit form
    fireEvent.press(getByText("Submit"));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });

    expect(Alert.alert).not.toHaveBeenCalledWith("Error", expect.any(String));
  });
});
