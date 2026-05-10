import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from 'react';
import { useState } from 'react';
import { ADD_PEARL_ALLOWED_THEMES } from '../../constants';
import type {
  AddPearlTheme,
  CreatePearlInput,
  PearlOwner,
} from '../../features/admin/types';
import { PearlOwnerSelect } from './PearlOwnerSelect';

interface AddPearlFormProps {
  owners: PearlOwner[];
  isLoadingOwners: boolean;
  isCreatingOwner: boolean;
  isSaving: boolean;
  ownerErrorMessage: string | null;
  submitErrorMessage: string | null;
  onCreateOwner: (name: string) => Promise<PearlOwner>;
  onSubmit: (input: CreatePearlInput) => Promise<void>;
}

type FormErrors = Partial<Record<keyof FormState | 'pearlOwnerId', string>>;

interface FormState {
  name: string;
  story: string;
  theme: AddPearlTheme | '';
  latitude: string;
  longitude: string;
  pearlOwnerId: string;
}

const initialFormState: FormState = {
  name: '',
  story: '',
  theme: 'Culture',
  latitude: '',
  longitude: '',
  pearlOwnerId: '',
};

export function AddPearlForm({
  owners,
  isLoadingOwners,
  isCreatingOwner,
  isSaving,
  ownerErrorMessage,
  submitErrorMessage,
  onCreateOwner,
  onSubmit,
}: AddPearlFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    try {
      await onSubmit(parsed.input);
    } catch {
      // The page-level mutation owns API error rendering.
    }
  }

  return (
    <form className="admin-pearl-form" onSubmit={handleSubmit}>
      <section className="admin-form-card">
        <div>
          <p className="admin-eyebrow">Admin-only creation</p>
          <h1 className="admin-dashboard-title">Add Pearl</h1>
          <p className="admin-dashboard-copy">
            Create a route-ready Pearl with an explicit PearlOwner
            relationship. Coordinates are the location source; no images,
            moderation, or public submission flow is part of this form.
          </p>
        </div>

        <div className="admin-pearl-form-grid">
          <label className="admin-field">
            <span className="admin-field__label">Name</span>
            <input
              className="admin-input"
              value={form.name}
              onChange={(event) => {
                updateField(setForm, 'name', event.target.value);
              }}
            />
            {errors.name && <p className="admin-inline-error">{errors.name}</p>}
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Theme</span>
            <select
              className="admin-select"
              value={form.theme}
              onChange={(event) => {
                updateField(
                  setForm,
                  'theme',
                  event.target.value as AddPearlTheme,
                );
              }}
            >
              {ADD_PEARL_ALLOWED_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
            {errors.theme && (
              <p className="admin-inline-error">{errors.theme}</p>
            )}
          </label>
        </div>

        <label className="admin-field">
          <span className="admin-field__label">Story</span>
          <textarea
            className="admin-input admin-textarea"
            value={form.story}
            onChange={(event) => {
              updateField(setForm, 'story', event.target.value);
            }}
            rows={5}
          />
          {errors.story && <p className="admin-inline-error">{errors.story}</p>}
        </label>

        <div className="admin-pearl-form-grid">
          <label className="admin-field">
            <span className="admin-field__label">Latitude</span>
            <input
              className="admin-input"
              inputMode="decimal"
              value={form.latitude}
              onChange={(event) => {
                updateField(setForm, 'latitude', event.target.value);
              }}
            />
            {errors.latitude && (
              <p className="admin-inline-error">{errors.latitude}</p>
            )}
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Longitude</span>
            <input
              className="admin-input"
              inputMode="decimal"
              value={form.longitude}
              onChange={(event) => {
                updateField(setForm, 'longitude', event.target.value);
              }}
            />
            {errors.longitude && (
              <p className="admin-inline-error">{errors.longitude}</p>
            )}
          </label>
        </div>
      </section>

      <PearlOwnerSelect
        owners={owners}
        selectedOwnerId={form.pearlOwnerId}
        isLoading={isLoadingOwners}
        isCreating={isCreatingOwner}
        errorMessage={ownerErrorMessage}
        fieldError={errors.pearlOwnerId ?? null}
        onSelect={(pearlOwnerId) => {
          updateField(setForm, 'pearlOwnerId', pearlOwnerId);
        }}
        onCreateOwner={async (name) => {
          const owner = await onCreateOwner(name);
          updateField(setForm, 'pearlOwnerId', owner.id);
        }}
      />

      {submitErrorMessage && (
        <section className="admin-state-card admin-state-card--compact">
          <p className="admin-state-kicker">Could not save Pearl</p>
          <p className="admin-state-copy">{submitErrorMessage}</p>
        </section>
      )}

      <button
        className="admin-primary-button admin-pearl-submit"
        type="submit"
        disabled={isSaving || isCreatingOwner}
      >
        {isSaving ? 'Saving Pearl...' : 'Save Pearl'}
      </button>
    </form>
  );
}

type ParsedForm =
  | { ok: true; input: CreatePearlInput }
  | { ok: false; errors: FormErrors };

function parseForm(form: FormState): ParsedForm {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!form.story.trim()) {
    errors.story = 'Story is required.';
  }

  if (!isAddPearlTheme(form.theme)) {
    errors.theme = 'Choose one of the allowed PRL themes.';
  }

  const latitude = Number(form.latitude);
  if (
    !form.latitude.trim() ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    errors.latitude = 'Latitude must be a number between -90 and 90.';
  }

  const longitude = Number(form.longitude);
  if (
    !form.longitude.trim() ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    errors.longitude = 'Longitude must be a number between -180 and 180.';
  }

  if (!form.pearlOwnerId) {
    errors.pearlOwnerId = 'PearlOwner is required.';
  }

  if (Object.keys(errors).length > 0 || !isAddPearlTheme(form.theme)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      name: form.name.trim(),
      story: form.story.trim(),
      theme: form.theme,
      latitude,
      longitude,
      pearlOwnerId: form.pearlOwnerId,
    },
  };
}

function isAddPearlTheme(value: string): value is AddPearlTheme {
  return ADD_PEARL_ALLOWED_THEMES.includes(value as AddPearlTheme);
}

function updateField<K extends keyof FormState>(
  setForm: Dispatch<SetStateAction<FormState>>,
  key: K,
  value: FormState[K],
) {
  setForm((current) => ({
    ...current,
    [key]: value,
  }));
}
