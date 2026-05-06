import { useState } from 'react';
import type { PearlOwner } from '../../features/admin/types';

interface PearlOwnerSelectProps {
  owners: PearlOwner[];
  selectedOwnerId: string;
  isLoading: boolean;
  isCreating: boolean;
  errorMessage: string | null;
  fieldError: string | null;
  onSelect: (ownerId: string) => void;
  onCreateOwner: (name: string) => Promise<void>;
}

export function PearlOwnerSelect({
  owners,
  selectedOwnerId,
  isLoading,
  isCreating,
  errorMessage,
  fieldError,
  onSelect,
  onCreateOwner,
}: PearlOwnerSelectProps) {
  const [newOwnerName, setNewOwnerName] = useState('');

  return (
    <section className="admin-pearl-owner-panel">
      <div>
        <h2 className="admin-form-section-title">PearlOwner</h2>
        <p className="admin-form-section-copy">
          Select an existing owner or create one before saving the Pearl.
        </p>
      </div>

      <label className="admin-field">
        <span className="admin-field__label">Existing PearlOwner</span>
        <select
          className="admin-select"
          value={selectedOwnerId}
          onChange={(event) => onSelect(event.target.value)}
          disabled={isLoading || isCreating}
        >
          <option value="">
            {isLoading ? 'Loading PearlOwners...' : 'Select PearlOwner'}
          </option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </label>

      {fieldError && <p className="admin-inline-error">{fieldError}</p>}

      <div className="admin-owner-create-row">
        <label className="admin-field admin-owner-create-row__input">
          <span className="admin-field__label">Create PearlOwner</span>
          <input
            className="admin-input"
            value={newOwnerName}
            onChange={(event) => setNewOwnerName(event.target.value)}
            placeholder="Owner name"
            disabled={isCreating}
          />
        </label>

        <button
          className="admin-secondary-button admin-owner-create-row__button"
          type="button"
          disabled={isCreating || !newOwnerName.trim()}
          onClick={() => {
            const ownerName = newOwnerName.trim();
            void onCreateOwner(ownerName)
              .then(() => {
                setNewOwnerName('');
              })
              .catch(() => undefined);
          }}
        >
          {isCreating ? 'Creating...' : 'Create owner'}
        </button>
      </div>

      {errorMessage && <p className="admin-inline-error">{errorMessage}</p>}
    </section>
  );
}
