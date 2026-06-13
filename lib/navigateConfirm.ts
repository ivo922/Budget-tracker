import { useRouter } from 'expo-router';

type ConfirmParams = {
  type: 'account' | 'goal' | 'category' | 'transaction';
  id: string;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Screens to dismiss after success (default 1). */
  dismiss?: number;
};

export function navigateToConfirm(router: ReturnType<typeof useRouter>, params: ConfirmParams) {
  router.push({
    pathname: '/confirm',
    params: {
      type: params.type,
      id: params.id,
      title: params.title,
      message: params.message,
      confirmLabel: params.confirmLabel ?? 'Delete',
      dismiss: String(params.dismiss ?? 1),
    },
  });
}
