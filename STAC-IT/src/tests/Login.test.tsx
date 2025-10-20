import { render, fireEvent, waitFor } from '@testing-library/react-native';

import Login from '../screens/Login';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { getDoc } from 'firebase/firestore';


// Jest by default only looks for tests files that either
//  1. end in .test.js, or .test.tsx etc
//  2. inside a folder named __tests__
jest.mock('@firebase/auth');
jest.mock('firebase/firestore');

describe('Login Screen UI', () => {
  test('Renders all required input fields and links', () => {
    const { getByPlaceholderText, getByText } = render(<Login navigation={{ navigate: jest.fn() }} />);

    // Check input placeholders
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();

    // Check buttons/links
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('New to STAC-IT? Create account')).toBeTruthy();
    expect(getByText('Forgot password?')).toBeTruthy();
  });
});

describe('Email Validation', () => {
    test('Displays an error for invalid emails, hides error for valid emails', () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<Login navigation={{ navigate: jest.fn() }} />);
      const emailInput = getByPlaceholderText('Email');

      fireEvent.changeText(emailInput, 'invalid-email');
      expect(getByText('Invalid email address')).toBeTruthy();

      fireEvent.changeText(emailInput, 'valid@example.com');
      expect(queryByText('Invalid email address')).toBeNull();
    });
});

describe('Password Field', () => {
    test('Toggles visibility when the eye icon is pressed', () => {
      const { getByPlaceholderText, getByRole } = render(<Login navigation={{ navigate: jest.fn() }} />);
      const passwordInput = getByPlaceholderText('Password');
      const toggleButton = getByRole('button');

      expect(passwordInput.props.secureTextEntry).toBe(true); // Password is initially hidden

      fireEvent.press(toggleButton); // When eye toggle is pressed
      expect(passwordInput.props.secureTextEntry).toBe(false); // Password is now visible
    });
});

describe('Navigation Behavior', () => {
    test('Navigates to CreateAccount when "New to STAC-IT? Create account" is pressed', () => {
        const navigate = jest.fn();
        const { getByText } = render(<Login navigation={{ navigate }} />);

        fireEvent.press(getByText('New to STAC-IT? Create account'));
        expect(navigate).toHaveBeenCalledWith('CreateAccount');
    });

    test('Navigates to ForgetPassword when "Forgot password?" is pressed', () => {
        const navigate = jest.fn();
        const { getByText } = render(<Login navigation={{ navigate }} />);

        fireEvent.press(getByText('Forgot password?'));
        expect(navigate).toHaveBeenCalledWith('ForgetPassword');
    });
});

describe('Login Firebase flow', () => {
  test('Navigates to MainTabs after successful login', async () => {
    const navigate = jest.fn();

    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: '123', emailVerified: true },
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ fullName: 'Test User', birthDate: '2000-01-01' }),
    });

    const { getByText, getByPlaceholderText } = render(<Login navigation={{ navigate }} />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('MainTabs');
    });
  });
});

