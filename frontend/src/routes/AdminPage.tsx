import { useEffect, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { adminApi, ApiError } from '../api/client';
import { AdminDashboardPage } from '../components/admin/AdminDashboardPage';
import { AdminLoginPage } from '../components/admin/AdminLoginPage';
import type {
  AdminAnalyticsFilters,
  AdminBreakdownsResponse,
  AdminOverviewResponse,
  AdminTimeseriesResponse,
} from '../features/admin/types';
import { getDefaultAdminAnalyticsFilters } from '../features/admin/utils';

/**
 * Supported FR IDs: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-02, GH-AN-03, GH-AN-04
 */
type AdminSessionState = 'checking' | 'unauthorized' | 'authenticated';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminAnalyticsFilters>(
    getDefaultAdminAnalyticsFilters,
  );
  const [sessionState, setSessionState] =
    useState<AdminSessionState>('checking');

  const adminQueryEnabled = sessionState !== 'unauthorized';

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview', filters.from, filters.to, filters.theme],
    queryFn: () => adminApi.overview(filters),
    enabled: adminQueryEnabled,
    retry: false,
  });

  const timeseriesQuery = useQuery({
    queryKey: ['admin', 'timeseries', filters.from, filters.to, filters.theme],
    queryFn: () => adminApi.timeseries(filters),
    enabled: adminQueryEnabled,
    retry: false,
  });

  const breakdownsQuery = useQuery({
    queryKey: ['admin', 'breakdowns', filters.from, filters.to, filters.theme],
    queryFn: () => adminApi.breakdowns(filters),
    enabled: adminQueryEnabled,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (passphrase: string) => adminApi.login(passphrase),
    onSuccess: async () => {
      setSessionState('authenticated');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'timeseries'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'breakdowns'] }),
      ]);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => adminApi.logout(),
    onSettled: async () => {
      setSessionState('unauthorized');
      await queryClient.removeQueries({ queryKey: ['admin'] });
    },
  });

  const hasUnauthorizedError = [
    overviewQuery,
    timeseriesQuery,
    breakdownsQuery,
  ].some((query) => query.isError && isUnauthorizedApiError(query.error));

  const hasNonUnauthorizedSettledState = [
    overviewQuery,
    timeseriesQuery,
    breakdownsQuery,
  ].some((query) => {
    if (query.isSuccess) {
      return true;
    }

    return query.isError && !isUnauthorizedApiError(query.error);
  });

  useEffect(() => {
    if (hasUnauthorizedError) {
      setSessionState('unauthorized');
      return;
    }

    if (hasNonUnauthorizedSettledState) {
      setSessionState('authenticated');
    }
  }, [hasNonUnauthorizedSettledState, hasUnauthorizedError]);

  const analyticsError =
    firstNonUnauthorizedError([
      overviewQuery,
      timeseriesQuery,
      breakdownsQuery,
    ]) ?? null;

  if (sessionState === 'unauthorized' || hasUnauthorizedError) {
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

  return (
    <AdminDashboardPage
      filters={filters}
      overview={overviewQuery.data as AdminOverviewResponse | undefined}
      timeseries={timeseriesQuery.data as AdminTimeseriesResponse | undefined}
      breakdowns={breakdownsQuery.data as AdminBreakdownsResponse | undefined}
      isLoading={
        overviewQuery.isPending ||
        timeseriesQuery.isPending ||
        breakdownsQuery.isPending
      }
      isLoggingOut={logoutMutation.isPending}
      errorMessage={analyticsError?.message ?? null}
      onApplyFilters={setFilters}
      onRetry={() => {
        void Promise.all([
          overviewQuery.refetch(),
          timeseriesQuery.refetch(),
          breakdownsQuery.refetch(),
        ]);
      }}
      onLogout={async () => {
        await logoutMutation.mutateAsync();
      }}
    />
  );
}

function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function firstNonUnauthorizedError(
  queries: Array<{
    error: unknown;
    isError: boolean;
  }>,
) {
  return queries.find(
    (query): query is {
      error: ApiError;
      isError: true;
    } => query.isError && query.error instanceof ApiError && query.error.status !== 401,
  )?.error;
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
