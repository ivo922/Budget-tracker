import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from '@/lib/context/AppContext';
import { darkTheme, lightTheme, type AppTheme } from '@/lib/theme';

function stackScreenOptions(theme: AppTheme) {
  return {
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.onSurface,
    headerTitleStyle: { color: theme.colors.onSurface },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  };
}

function RootNavigator() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={stackScreenOptions(theme)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account/[id]" options={{ title: 'Account' }} />
        <Stack.Screen name="transactions/index" options={{ title: 'All transactions' }} />
        <Stack.Screen name="transaction/add" options={{ title: 'Add Transaction', presentation: 'card' }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Edit Transaction' }} />
        <Stack.Screen name="categories/index" options={{ title: 'Categories' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </PaperProvider>
  );
}
