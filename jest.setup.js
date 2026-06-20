let mockUuidCounter = 0;

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `test-uuid-${++mockUuidCounter}`),
}));
