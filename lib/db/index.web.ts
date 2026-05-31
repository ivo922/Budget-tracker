// expo-sqlite native bindings are unavailable on web in SDK 52.
export function getDb(): never {
  throw new Error('SQLite is not available on web. Use the iOS or Android app.');
}

export async function initDatabase(): Promise<void> {}

export type AppDatabase = never;
