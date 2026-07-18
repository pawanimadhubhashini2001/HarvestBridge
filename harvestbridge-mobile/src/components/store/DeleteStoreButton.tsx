import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Snackbar } from 'react-native-paper';

import {
  deleteStore,
  getMyStoreQueryKey,
  getStoreDetailsQueryKey,
} from '@/api/store.api';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { getErrorMessage } from '@/utils/errorHandler';

type DeleteStoreButtonProps = {
  storeId: number | string;
  label?: string;
  mode?: 'contained' | 'outlined' | 'text';
  onDeleted?: () => void;
};

export function DeleteStoreButton({
  storeId,
  label = 'Delete Store',
  mode = 'outlined',
  onDeleted,
}: DeleteStoreButtonProps) {
  const queryClient = useQueryClient();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const deleteStoreMutation = useMutation({
    mutationFn: async () => deleteStore(storeId),
    onSuccess: async () => {
      queryClient.setQueryData(getMyStoreQueryKey(), null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) }),
      ]);
      setDialogVisible(false);
      setFeedbackMessage('Store profile deleted successfully.');
      onDeleted?.();
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  return (
    <>
      <Button
        mode={mode}
        buttonColor={mode === 'contained' ? undefined : undefined}
        textColor={mode === 'contained' ? undefined : '#B42318'}
        onPress={() => {
          setDialogVisible(true);
        }}
        loading={deleteStoreMutation.isPending}
        disabled={deleteStoreMutation.isPending}
      >
        {label}
      </Button>

      <ConfirmationDialog
        visible={dialogVisible}
        title="Delete Store Profile?"
        message="This will permanently remove your store profile if no harvest listings are linked to it."
        confirmLabel="Delete Store"
        cancelLabel="Cancel"
        loading={deleteStoreMutation.isPending}
        onCancel={() => {
          setDialogVisible(false);
        }}
        onConfirm={() => {
          void deleteStoreMutation.mutateAsync();
        }}
      />

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => {
          setFeedbackMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setFeedbackMessage(null);
          },
        }}
      >
        {feedbackMessage ?? ''}
      </Snackbar>
    </>
  );
}
