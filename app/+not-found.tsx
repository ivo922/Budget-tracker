import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Text style={styles.title}>Screen not found</Text>
      <Link href="/" style={styles.link}>
        <Text variant="labelLarge">Go to dashboard</Text>
      </Link>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', margin: 16 },
  link: { marginHorizontal: 16 },
});
