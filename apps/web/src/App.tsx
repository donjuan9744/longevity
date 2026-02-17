import { useCallback, useEffect, useState } from 'react';
import { getWeek, refreshWeek } from './api/plans';
import { cancelSession } from './api/sessions';
import Badge from './components/Badge';
import Card from './components/Card';
import Toast from './components/Toast';
import { useToast } from './components/useToast';
import CoachPage from './pages/CoachPage';
import TodayPage from './pages/TodayPage';
import WeekPage from './pages/WeekPage';
import type { WeekResponse } from './types/api';
import { getMondayIso } from './utils/dates';

type ViewMode = 'today' | 'week';
type CompletionPayload = { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean };

export default function App() {
  const isCoachMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/coach');
  const [view, setView] = useState<ViewMode>('today');
  const [weekStart] = useState<string>(() => getMondayIso(new Date()));
  const [weekData, setWeekData] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { message: toastMessage, showToast } = useToast();

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
      showToast('Week regenerated.');
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

  async function handleCompleted(payload: CompletionPayload): Promise<void> {
    if (payload.local) {
      setWeekData((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          days: prev.days.map((day) => {
            if (day.date === payload.date && day.type === payload.type && day.type !== 'strength') {
              return {
                ...day,
                status: 'COMPLETED'
              };
            }

            return day;
          })
        };
      });
      return;
    }

    await loadWeek();
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Longevity Coach</h1>
        <p className="muted">{isCoachMode ? 'Coach dashboard demo' : 'Today-first training plan'}</p>
        <div className="header-links">
          <a href="/">Athlete Mode</a>
          <a href="/coach">Coach Mode</a>
        </div>
      </header>

      {!token ? (
        <Card>
          <h2 className="card-title">Missing API token</h2>
          <p className="muted">Add `VITE_API_TOKEN` to `apps/web/.env.local` to load plans.</p>
        </Card>
      ) : null}

      {token && isCoachMode ? <CoachPage /> : null}

      {token && !isCoachMode ? (
        <>
          <section className="actions">
            <button className="btn" onClick={() => void handleRefresh()} disabled={loading}>
              Refresh Week
            </button>
            <button className="btn btn-ghost" onClick={() => setView(view === 'today' ? 'week' : 'today')}>
              {view === 'today' ? 'View Week' : 'Back to Today'}
            </button>
          </section>

          <div className="view-toggle">
            <Badge variant={view === 'today' ? 'info' : 'neutral'}>Today</Badge>
            <Badge variant={view === 'week' ? 'info' : 'neutral'}>Week</Badge>
          </div>

          {loading ? (
            <Card>
              <p className="loading">Loading week...</p>
              <div className="placeholder-line" />
              <div className="placeholder-line short" />
              <div className="placeholder-line" />
            </Card>
          ) : null}

          {!loading && error ? (
            <Card>
              <h2 className="card-title">Unable to load week</h2>
              <p className="muted error-detail">{error}</p>
              <button className="btn" onClick={() => void loadWeek()}>
                Retry
              </button>
            </Card>
          ) : null}

          {!loading && !error && weekData
            ? view === 'today'
              ? (
                <TodayPage
                  week={weekData}
                  completionScope="default"
                  onCancel={(id) => void handleCancel(id)}
                  onCompleted={(payload) => handleCompleted(payload)}
                />
              )
              : <WeekPage week={weekData} completionScope="default" onCompleted={(payload) => handleCompleted(payload)} />
            : null}
        </>
      ) : null}

      {toastMessage ? <Toast message={toastMessage} /> : null}
    </main>
  );
}
