import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProfilePage from "../screens/Profile";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Alert } from "react-native";

// Mock Firebase imports
jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_AUTH: { currentUser: { uid: "testUser" } },
  FIREBASE_DB: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
}));

// Polyfill setImmediate for React Native
global.setImmediate = global.setTimeout;

// Mock navigation
const mockNavigation: any = {
  navigate: jest.fn(),
  reset: jest.fn(),
};

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ fullName: "Test User", email: "test@example.com" }),
    });
  });

  test("renders user profile info", async () => {
    const { findByText } = render(<ProfilePage navigation={mockNavigation} />);

    await waitFor(async () => {
      expect(await findByText("Test User")).toBeTruthy();
      expect(await findByText("test@example.com")).toBeTruthy();
    });
  });

  test("calls signOut and navigates on logout", async () => {
    const { getByText } = render(<ProfilePage navigation={mockNavigation} />);
    const logoutButton = getByText("Log Out");

    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(FIREBASE_AUTH);
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Login" }],
      });
    });
  });

  test("calls editProfile, changePassword, notificationSettings buttons", async () => {
    const alertMock = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<ProfilePage navigation={mockNavigation} />);

    fireEvent.press(getByText("Edit Profile"));
    fireEvent.press(getByText("Change Password"));
    fireEvent.press(getByText("Notification Settings"));

    expect(alertMock).toHaveBeenCalledTimes(3);
    alertMock.mockRestore();
  });
});
