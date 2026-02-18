import { useCallback, useEffect, useState } from 'react';
import { getWeek, refreshWeek } from './api/plans';
import { cancelSession } from './api/sessions';
import Card from './components/Card';
import Toast from './components/Toast';
import { useToast } from './components/useToast';
import CoachPage from './pages/CoachPage';
import TodayPage from './pages/TodayPage';
import WeekPage from './pages/WeekPage';
import type { SessionExercise, WeekResponse } from './types/api';
import { getMondayIso } from './utils/dates';

type ViewMode = 'today' | 'week';
type CompletionPayload = { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean };
type SwapPayload = {
  date: string;
  sessionId: string;
  fromExerciseId: string;
  toExerciseId: string;
  toExerciseName: string;
};

export default function App() {
  const isCoachMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/coach');
  const [view, setView] = useState<ViewMode>('today');
  const [coachView, setCoachView] = useState<ViewMode>('today');
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
      showToast('Session marked complete.');
      return;
    }

    await loadWeek();
    showToast('Workout marked complete.');
  }

  function handleSwapApplied(payload: SwapPayload): void {
    setWeekData((prev) => {
      if (!prev) {
        return prev;
      }

      const day = prev.days.find((candidate) => candidate.date === payload.date && candidate.type === 'strength');
      if (!day || day.type !== 'strength') {
        return prev;
      }

      const updatedExercises: SessionExercise[] = day.session.exercises.map((exercise) =>
        exercise.exerciseId === payload.fromExerciseId
          ? { ...exercise, exerciseId: payload.toExerciseId, name: payload.toExerciseName }
          : exercise
      );

      return {
        ...prev,
        days: prev.days.map((candidate) => {
          if (candidate.date !== payload.date || candidate.type !== 'strength' || candidate.sessionId !== payload.sessionId) {
            return candidate;
          }

          return {
            ...candidate,
            session: {
              ...candidate.session,
              exercises: updatedExercises
            }
          };
        })
      };
    });
    showToast('Exercise swapped.');
  }

  return (
    <main className="app-shell coach-shell">
      <header className="app-header app-header-sticky">
        <div className="app-header-inner">
          <div className="app-header-left">
            <h1>Longevity Coach</h1>
            <p className="muted">Coach Dashboard</p>
          </div>
          <div className="app-header-right">
            <div className="header-segment">
              <a className={!isCoachMode ? 'header-segment-active' : ''} href="/">
                Athlete
              </a>
              <a className={isCoachMode ? 'header-segment-active' : ''} href="/coach">
                Coach
              </a>
            </div>
            <div className="header-segment">
              <button
                type="button"
                className={(isCoachMode ? coachView : view) === 'today' ? 'header-segment-active' : ''}
                onClick={() => {
                  if (isCoachMode) {
                    setCoachView('today');
                    return;
                  }
                  setView('today');
                }}
              >
                Today
              </button>
              <button
                type="button"
                className={(isCoachMode ? coachView : view) === 'week' ? 'header-segment-active' : ''}
                onClick={() => {
                  if (isCoachMode) {
                    setCoachView('week');
                    return;
                  }
                  setView('week');
                }}
              >
                Week
              </button>
            </div>
            <button
              className={`btn btn-ghost header-refresh-btn${isCoachMode ? ' header-refresh-btn-hidden' : ''}`}
              onClick={() => void handleRefresh()}
              disabled={loading || isCoachMode}
              aria-hidden={isCoachMode}
              tabIndex={isCoachMode ? -1 : 0}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {!token ? (
        <Card>
          <h2 className="card-title">Missing API token</h2>
          <p className="muted">Add `VITE_API_TOKEN` to `apps/web/.env.local` to load plans.</p>
        </Card>
      ) : null}

      {token && isCoachMode ? <CoachPage view={coachView} /> : null}

      {token && !isCoachMode ? (
        <>
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
                  onSwapApplied={(payload) => handleSwapApplied(payload)}
                  onCompleted={(payload) => handleCompleted(payload)}
                />
              )
              : (
                <WeekPage
                  week={weekData}
                  completionScope="default"
                  compactWeekGrid
                  onSwapApplied={(payload) => handleSwapApplied(payload)}
                  onCompleted={(payload) => handleCompleted(payload)}
                />
              )
            : null}
        </>
      ) : null}

      {toastMessage ? <Toast message={toastMessage} /> : null}
    </main>
  );
}
