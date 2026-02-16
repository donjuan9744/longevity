import { useCallback, useEffect, useState } from 'react';
import { getWeek, refreshWeek } from './api/plans';
import { cancelSession } from './api/sessions';
import TodayPage from './pages/TodayPage';
import WeekPage from './pages/WeekPage';
import type { WeekResponse } from './types/api';
import { getMondayIso } from './utils/dates';

type ViewMode = 'today' | 'week';

export default function App() {
  const [view, setView] = useState<ViewMode>('today');
  const [weekStart] = useState<string>(() => getMondayIso(new Date()));
  const [weekData, setWeekData] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const token = import.meta.env.VITE_API_TOKEN;

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getWeek(weekStart);
      setWeekData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load week.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    void loadWeek();
  }, [loadWeek, token]);

  async function handleRefresh(): Promise<void> {
    setLoading(true);
    setError('');

    try {
      const response = await refreshWeek(weekStart);
      setWeekData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load week.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(sessionId: string): Promise<void> {
    setLoading(true);
    setError('');

    try {
      await cancelSession(sessionId);
      await loadWeek();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load week.';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Longevity</h1>
        <p className="muted">Today-first training plan</p>
      </header>

      {!token ? (
        <section className="card">
          <p>Missing API token. Add VITE_API_TOKEN to apps/web/.env.local</p>
        </section>
      ) : null}

      {token ? (
        <>
          <section className="actions">
            <button className="btn" onClick={() => void handleRefresh()} disabled={loading}>
              Refresh Week
            </button>
            <button className="btn btn-ghost" onClick={() => setView(view === 'today' ? 'week' : 'today')}>
              {view === 'today' ? 'View Week' : 'Back to Today'}
            </button>
          </section>

          {loading ? <p className="loading">Loading week…</p> : null}

          {!loading && error ? (
            <section className="card">
              <p>Unable to load week.</p>
              <p className="muted error-detail">{error}</p>
              <button className="btn" onClick={() => void loadWeek()}>
                Retry
              </button>
            </section>
          ) : null}

          {!loading && !error && weekData
            ? view === 'today'
              ? (
                <TodayPage
                  week={weekData}
                  onCancel={(id) => void handleCancel(id)}
                  onRefreshWeek={() => loadWeek()}
                />
              )
              : <WeekPage week={weekData} onRefreshWeek={() => loadWeek()} />
            : null}
        </>
      ) : null}
    </main>
  );
}
