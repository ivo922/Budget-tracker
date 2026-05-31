import React from 'react';
import { AddTransactionForm } from '@/components/AddTransactionForm';
import { FabFormPopup } from '@/components/FabFormPopup';

export function AddTransactionFab() {
  return (
    <FabFormPopup>
      {({ close }) => <AddTransactionForm onClose={close} onSaved={close} />}
    </FabFormPopup>
  );
}
