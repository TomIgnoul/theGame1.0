import { useState } from 'react';

/**
 * Supported FR IDs: FR-19, FR-24, FR-25, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-02, GH-AN-04
 */
interface AdminLoginPageProps {
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (passphrase: string) => Promise<void>;
}

export function AdminLoginPage({
  errorMessage,
  isSubmitting,
  onSubmit,
}: AdminLoginPageProps) {
  const [passphrase, setPassphrase] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(passphrase);
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <p className="admin-eyebrow">Admin Portal</p>
        <h1 className="admin-login-title">Analytics access</h1>
        <p className="admin-login-copy">
          Use the shared admin passphrase to access the read-only analytics
          dashboard.
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span className="admin-field__label">Admin passphrase</span>
            <input
              className="admin-input"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Enter passphrase"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </label>

          {errorMessage && (
            <p className="admin-inline-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="admin-primary-button"
            type="submit"
            disabled={isSubmitting || passphrase.trim().length === 0}
          >
            {isSubmitting ? 'Checking access...' : 'Open dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}
