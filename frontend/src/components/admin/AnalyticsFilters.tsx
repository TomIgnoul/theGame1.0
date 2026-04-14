import { useEffect, useState } from 'react';
import { ALLOWED_THEMES } from '../../constants';
import type { AdminAnalyticsFilters } from '../../features/admin/types';

/**
 * Supported FR IDs: FR-21, FR-22, FR-23, FR-24, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-03, GH-AN-04
 */
interface AnalyticsFiltersProps {
  filters: AdminAnalyticsFilters;
  isBusy: boolean;
  onApply: (filters: AdminAnalyticsFilters) => void;
}

export function AnalyticsFilters({
  filters,
  isBusy,
  onApply,
}: AnalyticsFiltersProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(draft);
  }

  return (
    <form className="admin-filters" onSubmit={handleSubmit}>
      <label className="admin-field">
        <span className="admin-field__label">From</span>
        <input
          className="admin-input"
          type="date"
          value={draft.from}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              from: event.target.value,
            }));
          }}
          disabled={isBusy}
        />
      </label>

      <label className="admin-field">
        <span className="admin-field__label">To</span>
        <input
          className="admin-input"
          type="date"
          value={draft.to}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              to: event.target.value,
            }));
          }}
          disabled={isBusy}
        />
      </label>

      <label className="admin-field">
        <span className="admin-field__label">Theme</span>
        <select
          className="admin-select"
          value={draft.theme ?? ''}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              theme: event.target.value || null,
            }));
          }}
          disabled={isBusy}
        >
          <option value="">All themes</option>
          {ALLOWED_THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </label>

      <button className="admin-primary-button" type="submit" disabled={isBusy}>
        {isBusy ? 'Refreshing...' : 'Apply filters'}
      </button>
    </form>
  );
}
