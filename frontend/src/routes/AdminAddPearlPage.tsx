import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { adminApi, ApiError } from '../api/client';
import { AddPearlForm } from '../components/admin/AddPearlForm';
import { AdminLoginPage } from '../components/admin/AdminLoginPage';
import type { CreatePearlInput } from '../features/admin/types';

/**
 * Supported FR IDs: FR-27, FR-28, FR-29, FR-30, FR-31
 * Covered Gherkin IDs: GH-PRL-01, GH-PRL-02, GH-PRL-03, GH-PRL-04, GH-PRL-05
 */
type AdminSessionState = 'checking' | 'unauthorized' | 'authenticated';

export function AdminAddPearlPage() {
  const queryClient = useQueryClient();
  const [sessionState, setSessionState] =
    useState<AdminSessionState>('checking');

  const pearlOwnersQuery = useQuery({
    queryKey: ['admin', 'pearlOwners'],
    queryFn: () => adminApi.pearlOwners(),
    enabled: sessionState !== 'unauthorized',
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (passphrase: string) => adminApi.login(passphrase),
    onSuccess: async () => {
      setSessionState('authenticated');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pearlOwners'] });
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: (name: string) => adminApi.createPearlOwner({ name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pearlOwners'] });
    },
  });

  const createPearlMutation = useMutation({
    mutationFn: (input: CreatePearlInput) => adminApi.createPearl(input),
  });

  const isUnauthorized =
    pearlOwnersQuery.isError && isUnauthorizedApiError(pearlOwnersQuery.error);

  const resolvedSessionState: AdminSessionState =
    sessionState === 'authenticated'
      ? 'authenticated'
      : isUnauthorized
        ? 'unauthorized'
        : pearlOwnersQuery.isSuccess
          ? 'authenticated'
          : sessionState;

  if (resolvedSessionState === 'unauthorized') {
    return (
      <AdminLoginPage
        isSubmitting={loginMutation.isPending}
        errorMessage={getLoginErrorMessage(loginMutation.error)}
        onSubmit={async (passphrase) => {
          await loginMutation.mutateAsync(passphrase);
        }}
      />
    );
  }

  if (createPearlMutation.isSuccess) {
    const pearl = createPearlMutation.data;

    return (
      <main className="admin-dashboard-page admin-pearl-page">
        <section className="admin-state-card admin-pearl-success-card">
          <p className="admin-state-kicker">Pearl created</p>
          <h1 className="admin-state-title">{pearl.name}</h1>
          <p className="admin-state-copy">
            The Pearl is linked to {pearl.pearlOwner.name} and is now available
            as an active route candidate.
          </p>
          <button
            className="admin-primary-button"
            type="button"
            onClick={() => {
              createPearlMutation.reset();
            }}
          >
            Add another Pearl
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page admin-pearl-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">Pearl management</p>
          <h1 className="admin-dashboard-title">Create route-ready Pearl</h1>
          <p className="admin-dashboard-copy">
            Backend validation still owns the final save. This screen only
            handles the admin flow for manually curated Pearls.
          </p>
        </div>

        <a className="admin-secondary-link" href="/admin">
          Back to analytics
        </a>
      </header>

      <AddPearlForm
        owners={pearlOwnersQuery.data?.items ?? []}
        isLoadingOwners={pearlOwnersQuery.isPending}
        isCreatingOwner={createOwnerMutation.isPending}
        isSaving={createPearlMutation.isPending}
        ownerErrorMessage={getPearlOwnerErrorMessage(
          pearlOwnersQuery.error ?? createOwnerMutation.error,
        )}
        submitErrorMessage={getSubmitErrorMessage(createPearlMutation.error)}
        onCreateOwner={async (name) => createOwnerMutation.mutateAsync(name)}
        onSubmit={async (input) => {
          await createPearlMutation.mutateAsync(input);
        }}
      />
    </main>
  );
}

function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  if (error.code === 'invalid_admin_passphrase') {
    return 'The passphrase was not accepted.';
  }

  if (error.code === 'admin_auth_unavailable') {
    return 'Admin authentication is not configured on the backend.';
  }

  return error.message;
}

function getPearlOwnerErrorMessage(error: unknown) {
  if (!error || isUnauthorizedApiError(error)) {
    return null;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  return 'PearlOwners are unavailable right now.';
}

function getSubmitErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  return 'The Pearl could not be saved right now.';
}
