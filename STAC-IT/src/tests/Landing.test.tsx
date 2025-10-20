import { render, fireEvent } from '@testing-library/react-native';
import Landing from '../screens/Landing';

describe('Landing Screen', () => {
  test('Renders welcome text and Get Started button', () => {
    const { getByText } = render(<Landing navigation={{ navigate: jest.fn() }} />);

    expect(getByText('Welcome to STAC-IT')).toBeTruthy();
    expect(getByText('Get Started')).toBeTruthy();
  });

  test('Navigates to Login screen when Get Started is pressed', () => {
    const navigate = jest.fn();
    const { getByText } = render(<Landing navigation={{ navigate }} />);

    fireEvent.press(getByText('Get Started'));
    expect(navigate).toHaveBeenCalledWith('Login');
  });
});
