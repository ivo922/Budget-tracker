import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AddTransactionForm } from '@/components/AddTransactionForm';

/** Fallback route if linked directly; primary entry is the FAB popup. */
export default function AddTransactionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AddTransactionForm onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
