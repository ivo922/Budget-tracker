import React from 'react';
import { AddGoalForm } from '@/components/AddGoalForm';
import { FabFormPopup } from '@/components/FabFormPopup';

type Props = {
  onSaved?: () => void;
};

export function AddGoalFab({ onSaved }: Props) {
  return (
    <FabFormPopup>
      {({ close }) => (
        <AddGoalForm onClose={close} onSaved={onSaved} />
      )}
    </FabFormPopup>
  );
}
