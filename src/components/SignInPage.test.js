import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SignInPage from './SignInPage';

describe('SignInPage', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<SignInPage />);

    // Check if the title, inputs, and button are rendered
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('allows entering email and password', () => {
    const { getByPlaceholderText } = render(<SignInPage />);

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');

    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('shows alert on sign in button press', () => {
    const { getByText } = render(<SignInPage />);

    const signInButton = getByText('Sign In');

    
    global.alert = jest.fn();

    
    fireEvent.press(signInButton);

    
    expect(global.alert).toHaveBeenCalledWith('Sign In Successful');
  });
});
