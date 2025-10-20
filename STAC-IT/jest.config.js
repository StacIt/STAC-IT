module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase|@react-native|react-native|@expo|expo|@react-native-community/datetimepicker)/)',
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
