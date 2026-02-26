import { Platform, PlatformColor } from 'react-native';

const iosColor = (name: string, fallback: string) =>
  Platform.OS === 'ios' ? PlatformColor(name) : fallback;

export const platformColors = {
  background: iosColor('systemBackground', '#ffffff'),
  groupedBackground: iosColor('systemGroupedBackground', '#f0f2f5'),
  secondaryBackground: iosColor('secondarySystemBackground', '#f5f5f5'),
  tertiaryBackground: iosColor('tertiarySystemBackground', '#f8f8f8'),
  surface: iosColor('secondarySystemGroupedBackground', '#ffffff'),
  textPrimary: iosColor('label', '#333333'),
  textSecondary: iosColor('secondaryLabel', '#666666'),
  textTertiary: iosColor('tertiaryLabel', '#888888'),
  placeholder: iosColor('placeholderText', '#aaaaaa'),
  separator: iosColor('separator', '#cccccc'),
  opaqueSeparator: iosColor('opaqueSeparator', '#eeeeee'),
  link: iosColor('link', '#007AFF'),
  accent: iosColor('systemPurple', '#6200ea'),
  danger: iosColor('systemRed', '#dc3545'),
  success: iosColor('systemGreen', '#4CAF50'),
  neutral: iosColor('systemGray', '#555555'),
  neutralStrong: iosColor('systemGray2', '#4a4a4a'),
  neutralSoft: iosColor('systemGray5', '#dddddd'),
  overlay: iosColor('systemGray6', 'rgba(0, 0, 0, 0.5)'),
  info: iosColor('systemBlue', '#2196F3'),
  highlight: iosColor('systemIndigoColor', '#e0e0ff'),
  white: '#ffffff',
  black: '#000000',
};
