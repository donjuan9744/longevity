import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWeek, refreshWeek } from '../api/plans';
import { upsertReadiness } from '../api/readiness';
import { cancelSession } from '../api/sessions';
import Card from '../components/Card';
import TodayPage from './TodayPage';
import WeekPage from './WeekPage';
import type { WeekResponse } from '../types/api';
import { getMondayIso } from '../utils/dates';

type ViewMode = 'today' | 'week';
type StrengthDays = 2 | 3 | 4 | 5;
type CompletionPayload = { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean };
type SwapPayload = {
  date: string;
  sessionId: string;
  fromExerciseId: string;
  toExerciseId: string;
  toExerciseName: string;
};

type DemoClient = {
  id: string;
  name: string;
  age: number;
};

type ClientSettings = {
  sleepHours: number;
  energy: number;
  soreness: number;
  stress: number;
  strengthDays: StrengthDays;
};

type Props = {
  view: ViewMode;
};

const DEMO_CLIENTS: DemoClient[] = [
  { id: 'john-davis', name: 'John Davis', age: 42 },
  { id: 'maria-lopez', name: 'Maria Lopez', age: 51 },
  { id: 'kevin-chen', name: 'Kevin Chen', age: 38 }
];

const STORAGE_SELECTED_CLIENT = 'longevity:coachDemo:selectedClient:v1';
const STORAGE_CLIENT_SETTINGS = 'longevity:coachDemo:clientSettings:v1';

function defaultClientSettings(): ClientSettings {
  return {
    sleepHours: 7,
    energy: 3,
    soreness: 2,
    stress: 2,
    strengthDays: 3
  };
}

function loadSelectedClientId(): string {
  if (typeof window === 'undefined') {
    return DEMO_CLIENTS[0]!.id;
  }

  const value = window.localStorage.getItem(STORAGE_SELECTED_CLIENT);
  if (value && DEMO_CLIENTS.some((client) => client.id === value)) {
    return value;
  }

  return DEMO_CLIENTS[0]!.id;
}

function loadClientSettings(): Record<string, ClientSettings> {
  const defaults = Object.fromEntries(DEMO_CLIENTS.map((client) => [client.id, defaultClientSettings()])) as Record<
    string,
    ClientSettings
  >;

  if (typeof window === 'undefined') {
    return defaults;
  }

  const raw = window.localStorage.getItem(STORAGE_CLIENT_SETTINGS);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return defaults;
    }

    return {
      ...defaults,
      ...(parsed as Record<string, ClientSettings>)
    };
  } catch {
    return defaults;
  }
}

function aiExplanation(settings: ClientSettings): string {
  if (settings.sleepHours <= 5 && settings.soreness >= 4) {
    return 'Reduced volume due to low sleep and high soreness.';
  }

  if (settings.energy <= 2 || settings.stress >= 4) {
    return 'Kept intensity conservative and spread stress more evenly this week.';
  }

  if (settings.sleepHours >= 8 && settings.energy >= 4 && settings.soreness <= 2) {
    return 'Readiness is strong, so the week keeps normal volume with progressive strength focus.';
  }

  return 'Plan balanced for steady progress while managing fatigue and recovery.';
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readinessLabel(settings: ClientSettings): 'Low' | 'Moderate' | 'High' {
  if (settings.sleepHours <= 5 || settings.energy <= 2 || settings.stress >= 4 || settings.soreness >= 4) {
    return 'Low';
  }

  if (settings.sleepHours <= 6 || settings.energy === 3 || settings.stress === 3 || settings.soreness === 3) {
    return 'Moderate';
  }

  return 'High';
}

function fatigueLevel(settings: ClientSettings): 'on-track' | 'moderate' | 'high' {
  const readiness = readinessLabel(settings);
  if (readiness === 'Low' && (settings.stress >= 4 || settings.soreness >= 4)) {
    return 'high';
  }

  if (readiness !== 'High') {
    return 'moderate';
  }

  return 'on-track';
}

export default function CoachPage({ view }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>(() => loadSelectedClientId());
  const [settingsByClient, setSettingsByClient] = useState<Record<string, ClientSettings>>(() => loadClientSettings());
  const [weekByClient, setWeekByClient] = useState<Record<string, WeekResponse | undefined>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [baseWeekStart] = useState<string>(() => getMondayIso(new Date()));
  const [checkInText, setCheckInText] = useState<string>('');
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [showInterpretedLabel, setShowInterpretedLabel] = useState<boolean>(false);
  const [clientDrawerOpen, setClientDrawerOpen] = useState<boolean>(false);
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState<boolean>(false);

  const selectedClient = useMemo(
    () => DEMO_CLIENTS.find((client) => client.id === selectedClientId) ?? DEMO_CLIENTS[0]!,
    [selectedClientId]
  );
  const selectedSettings = settingsByClient[selectedClient.id] ?? defaultClientSettings();
  const selectedWeek = weekByClient[selectedClient.id];
  const coachNote = selectedWeek ? aiExplanation(selectedSettings) : 'Generate the week to see coaching rationale.';

  const impactChips = useMemo(() => {
    const chips: string[] = [];
    if (selectedSettings.sleepHours <= 5 || selectedSettings.stress >= 4) {
      chips.push('Volume ↓');
    }
    if (selectedSettings.energy <= 2) {
      chips.push('Intensity ↓');
    }
    if (selectedSettings.soreness >= 4) {
      chips.push('Mobility +');
    }
    if (
      selectedSettings.sleepHours >= 7 &&
      selectedSettings.energy >= 3 &&
      selectedSettings.stress <= 2 &&
      selectedSettings.soreness <= 2
    ) {
      chips.push('Load ↔');
    }

    return chips.length > 0 ? chips : ['No change'];
  }, [selectedSettings]);

  const insightItems = useMemo(() => {
    const items: string[] = [];
    if (selectedSettings.sleepHours <= 5) {
      items.push('Lower sleep is driving a recovery-biased week.');
    }
    if (selectedSettings.stress >= 4) {
      items.push('Stress remains high; intensity is distributed more conservatively.');
    }
    if (selectedSettings.soreness >= 4) {
      items.push('Soreness trend supports additional mobility and lighter loading.');
    }
    if (items.length === 0) {
      items.push('Readiness trend is stable for planned progression this week.');
    }

    return items.slice(0, 3);
  }, [selectedSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_SELECTED_CLIENT, selectedClientId);
  }, [selectedClientId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_CLIENT_SETTINGS, JSON.stringify(settingsByClient));
  }, [settingsByClient]);

  const loadWeekForClient = useCallback(
    async (clientId: string, strengthDays: StrengthDays) => {
      const response = await getWeek(baseWeekStart, strengthDays, clientId);
      setWeekByClient((prev) => ({ ...prev, [clientId]: response }));
      return response;
    },
    [baseWeekStart]
  );

  useEffect(() => {
    const settings = settingsByClient[selectedClientId] ?? defaultClientSettings();
    if (weekByClient[selectedClientId]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    void loadWeekForClient(selectedClientId, settings.strengthDays)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load week.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [loadWeekForClient, selectedClientId, settingsByClient, weekByClient]);

  function patchSelectedClientSettings(patch: Partial<ClientSettings>): void {
    setSettingsByClient((prev) => ({
      ...prev,
      [selectedClient.id]: {
        ...(prev[selectedClient.id] ?? defaultClientSettings()),
        ...patch
      }
    }));
  }

  function handleInterpretCheckIn(): void {
    const normalized = checkInText.toLowerCase();
    const patch: Partial<ClientSettings> = {};
    const lowSleepMatch = /(\b[0-4]\b|\b5\b).*hour/i.test(normalized);

    if (lowSleepMatch || normalized.includes('poor sleep')) {
      patch.sleepHours = 5;
      patch.energy = 2;
    }
    if (normalized.includes('high stress') || normalized.includes('stressed')) {
      patch.stress = 4;
    }
    if (normalized.includes('sore') || normalized.includes('legs sore')) {
      patch.soreness = 4;
    }
    if (normalized.includes('low energy') || normalized.includes('tired') || normalized.includes('fatigue')) {
      patch.energy = 2;
    }
    if (normalized.includes('great') || normalized.includes('energized')) {
      patch.energy = 4;
    }

    if (Object.keys(patch).length > 0) {
      patchSelectedClientSettings(patch);
      setManualOverride(true);
      setShowInterpretedLabel(true);
    }
  }

  async function handleApplyAndRegenerate(): Promise<void> {
    setApplying(true);
    setError('');

    try {
      await upsertReadiness({
        date: todayIsoDate(),
        sleepHours: selectedSettings.sleepHours,
        energy: selectedSettings.energy,
        soreness: selectedSettings.soreness,
        stress: selectedSettings.stress
      });

      const refreshed = await refreshWeek(baseWeekStart, selectedSettings.strengthDays, selectedClient.id);
      setWeekByClient((prev) => ({ ...prev, [selectedClient.id]: refreshed }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to regenerate week.';
      setError(message);
    } finally {
      setApplying(false);
    }
  }

  async function handleCancel(sessionId: string): Promise<void> {
    setError('');
    try {
      await cancelSession(sessionId, selectedClient.id);
      await loadWeekForClient(selectedClient.id, selectedSettings.strengthDays);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to cancel workout.';
      setError(message);
    }
  }

  async function handleCompleted(payload: CompletionPayload): Promise<void> {
    if (payload.local) {
      setWeekByClient((prev) => {
        const current = prev[selectedClient.id];
        if (!current) {
          return prev;
        }

        return {
          ...prev,
          [selectedClient.id]: {
            ...current,
            days: current.days.map((day) => {
              if (day.date === payload.date && day.type === payload.type && day.type !== 'strength') {
                return {
                  ...day,
                  status: 'COMPLETED'
                };
              }

              return day;
            })
          }
        };
      });
      return;
    }

    await loadWeekForClient(selectedClient.id, selectedSettings.strengthDays);
  }

  function handleSwapApplied(payload: SwapPayload): void {
    setWeekByClient((prev) => {
      const current = prev[selectedClient.id];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [selectedClient.id]: {
          ...current,
          days: current.days.map((day) => {
            if (day.type !== 'strength' || day.date !== payload.date || day.sessionId !== payload.sessionId) {
              return day;
            }

            return {
              ...day,
              session: {
                ...day.session,
                exercises: day.session.exercises.map((exercise) =>
                  exercise.exerciseId === payload.fromExerciseId
                    ? { ...exercise, exerciseId: payload.toExerciseId, name: payload.toExerciseName }
                    : exercise
                )
              }
            };
          })
        }
      };
    });
  }

  return (
    <>
      <div className="coach-dashboard">
        <button className="btn btn-ghost coach-client-trigger" type="button" onClick={() => setClientDrawerOpen(true)}>
          Clients: {selectedClient.name}
        </button>

        {clientDrawerOpen ? <button className="coach-drawer-backdrop" onClick={() => setClientDrawerOpen(false)} aria-label="Close clients drawer" /> : null}

        <aside className={`coach-sidebar${clientDrawerOpen ? ' coach-sidebar-open' : ''}`}>
          <div className="coach-sidebar-head">
            <h3 className="coach-sidebar-title">Clients</h3>
          </div>

          <ul className="coach-client-list">
            {DEMO_CLIENTS.map((client) => {
              const clientSettings = settingsByClient[client.id] ?? defaultClientSettings();
              const clientWeek = weekByClient[client.id];
              const completed = clientWeek ? clientWeek.days.filter((day) => day.status === 'COMPLETED').length : 0;
              const total = clientWeek ? clientWeek.days.length : 5;
              const readiness = readinessLabel(clientSettings);
              const fatigue = fatigueLevel(clientSettings);

              return (
                <li key={client.id}>
                  <button
                    type="button"
                    className={`coach-client-item${selectedClient.id === client.id ? ' coach-client-item-active' : ''}`}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setClientDrawerOpen(false);
                    }}
                  >
                    <span className={`coach-status-dot coach-status-${fatigue}`} aria-hidden="true" />
                    <span className="coach-client-copy">
                      <strong>{client.name}</strong>
                      <span className="muted">
                        {completed}/{total} complete • Readiness: {readiness}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="coach-main">
          {loading ? (
            <Card>
              <p className="loading">Loading week...</p>
            </Card>
          ) : null}

          {!loading && error ? (
            <Card>
              <h3 className="card-title">Coach Mode Error</h3>
              <p className="error-detail">{error}</p>
            </Card>
          ) : null}

          {!loading && !error && selectedWeek
            ? view === 'today'
              ? (
                <TodayPage
                  week={selectedWeek}
                  completionScope={selectedClient.id}
                  onCancel={(sessionId) => void handleCancel(sessionId)}
                  onSwapApplied={(payload) => handleSwapApplied(payload)}
                  onCompleted={(payload) => handleCompleted(payload)}
                  hideSectionTitle
                />
              )
              : (
                <WeekPage
                  week={selectedWeek}
                  completionScope={selectedClient.id}
                  compactWeekGrid
                  onSwapApplied={(payload) => handleSwapApplied(payload)}
                  onCompleted={(payload) => handleCompleted(payload)}
                  hideSectionTitle
                />
              )
            : null}
        </section>

        <aside className="coach-rail">
          <Card className="coach-rail-card">
            <header className="coach-section-header">
              <h3 className="coach-section-title">Structure</h3>
            </header>
            <label className="coach-field">
              <span>Strength Days</span>
              <select
                value={selectedSettings.strengthDays}
                onChange={(event) => {
                  patchSelectedClientSettings({ strengthDays: Number(event.target.value) as StrengthDays });
                }}
              >
                {[2, 3, 4, 5].map((days) => (
                  <option key={days} value={days}>
                    {days}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          <Card className="coach-rail-card">
            <header className="coach-section-header">
              <h3 className="coach-section-title">Readiness Input</h3>
            </header>

            <label className="coach-field">
              <span>Client Check-In</span>
              <textarea
                value={checkInText}
                onChange={(event) => setCheckInText(event.target.value)}
                placeholder="e.g. Slept 5 hours. High stress. Legs sore."
                rows={3}
              />
            </label>

            <div className="coach-button-row coach-button-row-compact">
              <button className="btn btn-soft-primary" type="button" onClick={handleInterpretCheckIn}>
                Interpret
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setManualOverride((current) => !current)}>
                Manual Override
              </button>
            </div>

            {manualOverride ? (
              <div className="coach-manual-block">
                {showInterpretedLabel ? <p className="muted coach-inline-label">Interpreted readiness (editable)</p> : null}
                <div className="coach-grid coach-grid-compact">
                  <label className="coach-field">
                    <span>Sleep</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedSettings.sleepHours}
                      onChange={(event) => patchSelectedClientSettings({ sleepHours: Number(event.target.value) })}
                    />
                  </label>

                  <label className="coach-field">
                    <span>Energy</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={selectedSettings.energy}
                      onChange={(event) => patchSelectedClientSettings({ energy: Number(event.target.value) })}
                    />
                  </label>

                  <label className="coach-field">
                    <span>Soreness</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={selectedSettings.soreness}
                      onChange={(event) => patchSelectedClientSettings({ soreness: Number(event.target.value) })}
                    />
                  </label>

                  <label className="coach-field">
                    <span>Stress</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={selectedSettings.stress}
                      onChange={(event) => patchSelectedClientSettings({ stress: Number(event.target.value) })}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <button className="btn coach-apply-btn" disabled={applying} onClick={() => void handleApplyAndRegenerate()}>
              {applying ? 'Applying…' : 'Apply & Regenerate Week'}
            </button>
          </Card>

          <Card className="coach-rail-card">
            <header className="coach-section-header">
              <h3 className="coach-section-title">Impact Summary</h3>
            </header>
            <div className="coach-impact-chips">
              {impactChips.map((chip) => (
                <span key={chip} className="coach-impact-chip">
                  {chip}
                </span>
              ))}
            </div>
          </Card>

          <section className={`coach-insights-wrap${mobileInsightsOpen ? ' coach-insights-open' : ''}`}>
            <button className="coach-insights-toggle" onClick={() => setMobileInsightsOpen((prev) => !prev)} type="button">
              Insights
            </button>
            <Card className="coach-rail-card coach-insights-card">
              <header className="coach-section-header">
                <h3 className="coach-section-title">Insights</h3>
              </header>
              <ul className="coach-insights-list">
                {insightItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="coach-note muted">{coachNote}</p>
            </Card>
          </section>
        </aside>
      </div>
    </>
  );
}
