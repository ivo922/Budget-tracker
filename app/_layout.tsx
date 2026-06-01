import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from '@/lib/context/AppContext';
import { darkTheme, lightTheme, type AppTheme } from '@/lib/theme';

function stackScreenOptions(theme: AppTheme) {
  return {
    headerShown: false,
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="account/[id]" />
        <Stack.Screen name="transactions/index" />
        <Stack.Screen name="transaction/add" options={{ presentation: 'card' }} />
        <Stack.Screen name="transaction/[id]" />
        <Stack.Screen name="categories/index" />
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
