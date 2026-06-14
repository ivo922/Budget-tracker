import React from 'react';
import { AccountForm } from '@/components/AccountForm';

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export function AddAccountForm({ onClose, onCreated }: Props) {
  return <AccountForm mode="create" onClose={onClose} onSaved={onCreated} />;
}
