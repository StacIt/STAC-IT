jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => 'Ionicons',
  MaterialIcons: () => 'MaterialIcons',
  FontAwesome: () => 'FontAwesome',
}));
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to') &&
    args[0].includes('act(...)')
  ) {
    return;
  }
  originalError.call(console, ...args);
};