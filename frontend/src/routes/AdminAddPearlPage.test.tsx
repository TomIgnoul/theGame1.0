import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminApi, ApiError } from '../api/client';
import type {
  CreatePearlInput,
  PearlOwner,
} from '../features/admin/types';
import { AdminAddPearlPage } from './AdminAddPearlPage';

const EXISTING_OWNER: PearlOwner = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Visit Brussels',
};

const NEW_OWNER: PearlOwner = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Local Guide Collective',
};

describe('AdminAddPearlPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Add Pearl form and loads existing PearlOwners', async () => {
    mockPearlOwners([EXISTING_OWNER]);

    renderAdminAddPearlPage();

    expect(
      await screen.findByRole('heading', {
        name: 'Create route-ready Pearl',
      }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Story')).toBeTruthy();
    expect(screen.queryByLabelText('Address')).toBeNull();
    expect(await screen.findByText('Visit Brussels')).toBeTruthy();
  });

  it('submits a Pearl with an existing PearlOwner and shows success', async () => {
    mockPearlOwners([EXISTING_OWNER]);
    const createPearlMock = vi
      .spyOn(adminApi, 'createPearl')
      .mockImplementation(async (input) => ({
        id: '44444444-4444-4444-8444-444444444444',
        ...input,
        address: null,
        pearlOwner: EXISTING_OWNER,
        isRouteCandidate: true,
      }));

    renderAdminAddPearlPage();
    await fillPearlFields();

    const user = userEvent.setup();
    await user.selectOptions(
      await screen.findByLabelText('Existing PearlOwner'),
      EXISTING_OWNER.id,
    );
    await user.click(screen.getByRole('button', { name: 'Save Pearl' }));

    await waitFor(() => {
      expect(createPearlMock).toHaveBeenCalledWith(expectedPearlInput(
        EXISTING_OWNER.id,
      ));
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Hidden Courtyard',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/is now available as an active route candidate/i),
    ).toBeTruthy();
  });

  it('creates and selects a new PearlOwner before saving', async () => {
    mockPearlOwners([EXISTING_OWNER]);
    const createOwnerMock = vi
      .spyOn(adminApi, 'createPearlOwner')
      .mockResolvedValue(NEW_OWNER);
    const createPearlMock = vi
      .spyOn(adminApi, 'createPearl')
      .mockImplementation(async (input) => ({
        id: '44444444-4444-4444-8444-444444444444',
        ...input,
        address: null,
        pearlOwner: NEW_OWNER,
        isRouteCandidate: true,
      }));

    renderAdminAddPearlPage();

    const user = userEvent.setup();
    await screen.findByText('Visit Brussels');
    await user.type(screen.getByLabelText('Create PearlOwner'), NEW_OWNER.name);
    await user.click(screen.getByRole('button', { name: 'Create owner' }));

    await waitFor(() => {
      expect(createOwnerMock).toHaveBeenCalledWith({ name: NEW_OWNER.name });
    });

    await fillPearlFields();
    await user.click(screen.getByRole('button', { name: 'Save Pearl' }));

    await waitFor(() => {
      expect(createPearlMock).toHaveBeenCalledWith(expectedPearlInput(
        NEW_OWNER.id,
      ));
    });
  });

  it('shows validation errors for missing required fields', async () => {
    mockPearlOwners([EXISTING_OWNER]);

    renderAdminAddPearlPage();

    const user = userEvent.setup();
    await screen.findByText('Visit Brussels');
    await user.click(screen.getByRole('button', { name: 'Save Pearl' }));

    expect(await screen.findByText('Name is required.')).toBeTruthy();
    expect(screen.getByText('Story is required.')).toBeTruthy();
    expect(screen.getByText('Latitude must be a number between -90 and 90.')).toBeTruthy();
    expect(screen.getByText('Longitude must be a number between -180 and 180.')).toBeTruthy();
    expect(screen.getByText('PearlOwner is required.')).toBeTruthy();
  });

  it('shows validation errors for invalid coordinates', async () => {
    mockPearlOwners([EXISTING_OWNER]);

    renderAdminAddPearlPage();
    await fillPearlFields({ latitude: '91', longitude: '181' });

    const user = userEvent.setup();
    await user.selectOptions(
      await screen.findByLabelText('Existing PearlOwner'),
      EXISTING_OWNER.id,
    );
    await user.click(screen.getByRole('button', { name: 'Save Pearl' }));

    expect(await screen.findByText('Latitude must be a number between -90 and 90.')).toBeTruthy();
    expect(screen.getByText('Longitude must be a number between -180 and 180.')).toBeTruthy();
  });

  it('shows backend API errors cleanly', async () => {
    mockPearlOwners([EXISTING_OWNER]);
    vi.spyOn(adminApi, 'createPearl').mockRejectedValue(
      new ApiError(
        'theme must be one of: War, Museum, Streetart, Food, Culture',
        400,
        'invalid_theme',
      ),
    );

    renderAdminAddPearlPage();
    await fillPearlFields();

    const user = userEvent.setup();
    await user.selectOptions(
      await screen.findByLabelText('Existing PearlOwner'),
      EXISTING_OWNER.id,
    );
    await user.click(screen.getByRole('button', { name: 'Save Pearl' }));

    expect(
      await screen.findByText(
        'theme must be one of: War, Museum, Streetart, Food, Culture',
      ),
    ).toBeTruthy();
  });

  it('shows the admin login screen when the session is unauthorized', async () => {
    vi.spyOn(adminApi, 'pearlOwners').mockRejectedValue(
      new ApiError(
        'Admin authentication required',
        401,
        'admin_auth_required',
      ),
    );

    renderAdminAddPearlPage();

    expect(
      await screen.findByRole('heading', {
        name: 'Analytics access',
      }),
    ).toBeTruthy();
  });
});

function renderAdminAddPearlPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AdminAddPearlPage />
    </QueryClientProvider>,
  );

  return queryClient;
}

function mockPearlOwners(owners: PearlOwner[]) {
  vi.spyOn(adminApi, 'pearlOwners').mockResolvedValue({ items: owners });
}

async function fillPearlFields(
  overrides: Partial<{
    latitude: string;
    longitude: string;
  }> = {},
) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Hidden Courtyard');
  await user.type(
    screen.getByLabelText('Story'),
    'A small story about a quiet courtyard in Brussels.',
  );
  await user.type(screen.getByLabelText('Latitude'), overrides.latitude ?? '50.8467');
  await user.type(screen.getByLabelText('Longitude'), overrides.longitude ?? '4.3525');
}

function expectedPearlInput(pearlOwnerId: string): CreatePearlInput {
  return {
    name: 'Hidden Courtyard',
    story: 'A small story about a quiet courtyard in Brussels.',
    theme: 'Culture',
    latitude: 50.8467,
    longitude: 4.3525,
    pearlOwnerId,
  };
}
