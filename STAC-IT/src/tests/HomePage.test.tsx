import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native"
import { NavigationContainer } from "@react-navigation/native"
import { HomePage } from "../screens/HomePage"

// ✅ Mock StacForm — show when visible=true, disappear when visible=false
jest.mock("../components/StacForm", () => {
  const React = require("react")
  const { Text, Button, View } = require("react-native")

  return ({ visible, onClose }: any) =>
    visible ? (
      <View testID="modal">
        <Text>Create a New STAC</Text>
        <Button title="Close" onPress={onClose} />
      </View>
    ) : null
})

// Mock Firebase inside the factory function (deleteDoc inside too!)
jest.mock("../../FirebaseConfig", () => ({
  FIREBASE_AUTH: { currentUser: { uid: "test-user" } },
  FIREBASE_DB: {},
}))

jest.mock("firebase/firestore", () => {
  const deleteDocMock = jest.fn()

  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({
      forEach: (callback: any) => {
        callback({
          id: "stac1",
          data: () => ({
            stacName: "Test STAC",
            date: "2025-10-16",
            selectedOptions: { Activity: ["Option 1"] },
          }),
        })
        callback({
          id: "stac2",
          data: () => ({
            stacName: "Old STAC",
            date: "2023-01-01",
            selectedOptions: { Activity: ["Option 2"] },
          }),
        })
      },
    }),
    deleteDoc: deleteDocMock,
    doc: jest.fn(),
  }
})

test("renders HomePage header and Start New STAC button", async () => {
  render(
    <NavigationContainer>
      <HomePage />
    </NavigationContainer>
  )

  await waitFor(() => {
    expect(screen.getByText("STAC-IT")).toBeTruthy()
    expect(screen.getByText("Start New STAC")).toBeTruthy()
  })
})

test("pressing Start New STAC opens the modal", async () => {
  render(
    <NavigationContainer>
      <HomePage />
    </NavigationContainer>
  )

  const startButton = await screen.findByText("Start New STAC")
  fireEvent.press(startButton)

  await waitFor(() => {
    expect(screen.getByTestId("modal")).toBeTruthy()
  })
})

test("pressing Close button hides the modal", async () => {
  render(
    <NavigationContainer>
      <HomePage />
    </NavigationContainer>
  )

  const startButton = await screen.findByText("Start New STAC")
  fireEvent.press(startButton)

  // modal should be visible
  const modal = await screen.findByTestId("modal")
  expect(modal).toBeTruthy()

  // press the Close button inside mock modal
  const closeButton = screen.getByText("Close")
  fireEvent.press(closeButton)

  await waitFor(() => {
    expect(screen.queryByTestId("modal")).toBeNull()
  })
})
