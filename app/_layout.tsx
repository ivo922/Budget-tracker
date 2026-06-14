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
        <Stack.Screen name="account/add" />
        <Stack.Screen name="account/edit/[id]" />
        <Stack.Screen name="account/delete/[id]" />
        <Stack.Screen name="account/reorder" />
        <Stack.Screen name="transactions/index" />
        <Stack.Screen name="transaction/add" />
        <Stack.Screen name="transaction/[id]" />
        <Stack.Screen name="goal/add" />
        <Stack.Screen name="goal/[id]" />
        <Stack.Screen name="goal/link/[id]" />
        <Stack.Screen name="goal/edit/[id]" />
        <Stack.Screen name="category/add" />
        <Stack.Screen name="budgets/index" />
        <Stack.Screen name="budgets/edit" />
        <Stack.Screen name="confirm" />
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
