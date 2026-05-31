import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from '@/lib/context/AppContext';
import { darkTheme, lightTheme } from '@/lib/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account/[id]" options={{ title: 'Account' }} />
          <Stack.Screen name="transaction/add" options={{ title: 'Add Transaction', presentation: 'modal' }} />
          <Stack.Screen name="transaction/[id]" options={{ title: 'Edit Transaction' }} />
          <Stack.Screen name="categories/index" options={{ title: 'Categories' }} />
        </Stack>
      </AppProvider>
    </PaperProvider>
  );
}
