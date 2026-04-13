/**
 * Supported FR IDs: FR-19, FR-24, FR-25, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-02, GH-AN-04
 */
interface AdminErrorStateProps {
  description: string;
  onRetry: () => void;
}

export function AdminErrorState({
  description,
  onRetry,
}: AdminErrorStateProps) {
  return (
    <section className="admin-state-card" role="alert">
      <p className="admin-state-kicker">Backend error</p>
      <h2 className="admin-state-title">Analytics are unavailable right now</h2>
      <p className="admin-state-copy">{description}</p>
      <button
        className="admin-secondary-button"
        type="button"
        onClick={onRetry}
      >
        Retry analytics
      </button>
    </section>
  );
}
