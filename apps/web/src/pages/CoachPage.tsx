import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWeek, refreshWeek } from '../api/plans';
import { upsertReadiness } from '../api/readiness';
import { cancelSession } from '../api/sessions';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import TodayPage from './TodayPage';
import WeekPage from './WeekPage';
import type { WeekResponse } from '../types/api';
import { getMondayIso } from '../utils/dates';

type ViewMode = 'today' | 'week';
type StrengthDays = 2 | 3 | 4 | 5;
type CompletionPayload = { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean };

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
    return 'Reduced volume due to low sleep and high soreness. Prioritizing recovery quality this week.';
  }

  if (settings.energy <= 2 || settings.stress >= 4) {
    return 'Kept intensity conservative and spread stress more evenly across the week.';
  }

  if (settings.sleepHours >= 8 && settings.energy >= 4 && settings.soreness <= 2) {
    return 'Readiness is strong, so the week keeps normal volume with progressive strength focus.';
  }

  return 'Plan balanced for steady progress while managing fatigue and recovery.';
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachPage() {
  const [view, setView] = useState<ViewMode>('today');
  const [selectedClientId, setSelectedClientId] = useState<string>(() => loadSelectedClientId());
  const [settingsByClient, setSettingsByClient] = useState<Record<string, ClientSettings>>(() => loadClientSettings());
  const [weekByClient, setWeekByClient] = useState<Record<string, WeekResponse | undefined>>({});
  const [explanation, setExplanation] = useState<string>('Select a client and regenerate to see coaching rationale.');
  const [loading, setLoading] = useState<boolean>(true);
  const [applying, setApplying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [baseWeekStart] = useState<string>(() => getMondayIso(new Date()));
  const [checkInText, setCheckInText] = useState<string>('');
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [showInterpretedLabel, setShowInterpretedLabel] = useState<boolean>(false);

  const selectedClient = useMemo(
    () => DEMO_CLIENTS.find((client) => client.id === selectedClientId) ?? DEMO_CLIENTS[0]!,
    [selectedClientId]
  );
  const selectedSettings = settingsByClient[selectedClient.id] ?? defaultClientSettings();
  const selectedWeek = weekByClient[selectedClient.id];
  const hasReadinessValues =
    Number.isFinite(selectedSettings.sleepHours) &&
    Number.isFinite(selectedSettings.energy) &&
    Number.isFinite(selectedSettings.stress) &&
    Number.isFinite(selectedSettings.soreness);
  const expectedImpactItems: string[] = [];

  if (selectedSettings.sleepHours <= 5 || selectedSettings.stress >= 4) {
    expectedImpactItems.push('Training volume will be reduced.');
  }
  if (selectedSettings.soreness >= 4) {
    expectedImpactItems.push('Recovery emphasis will be added.');
  }
  if (selectedSettings.energy <= 2) {
    expectedImpactItems.push('Intensity will be slightly reduced.');
  }
  if (
    selectedSettings.sleepHours >= 7 &&
    selectedSettings.energy >= 3 &&
    selectedSettings.stress <= 2 &&
    selectedSettings.soreness <= 2
  ) {
    expectedImpactItems.push('Full training load maintained.');
  }

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
      setExplanation(aiExplanation(selectedSettings));
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
      await cancelSession(sessionId);
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

  return (
    <>
      <SectionTitle title="Coach Demo Mode" subtitle="Client management and week planning" />

      <Card>
        <div className="coach-grid">
          <label className="coach-field">
            <span>Client</span>
            <select
              value={selectedClient.id}
              onChange={(event) => {
                setSelectedClientId(event.target.value);
                setExplanation('Select a client and regenerate to see coaching rationale.');
              }}
            >
              {DEMO_CLIENTS.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.age})
                </option>
              ))}
            </select>
          </label>

          <label className="coach-field">
            <span>Strength days</span>
            <select
              value={selectedSettings.strengthDays}
              onChange={(event) => {
                patchSelectedClientSettings({
                  strengthDays: Number(event.target.value) as StrengthDays
                });
              }}
            >
              {[2, 3, 4, 5].map((days) => (
                <option key={days} value={days}>
                  {days}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="coach-grid">
          <label className="coach-field">
            <span>Client Check-in (natural language)</span>
            <textarea
              value={checkInText}
              onChange={(event) => setCheckInText(event.target.value)}
              placeholder="e.g. Slept 5 hours. High stress. Legs sore. Low motivation."
              rows={3}
            />
          </label>
          <label className="coach-field">
            <span>&nbsp;</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" type="button" onClick={handleInterpretCheckIn}>
                Interpret Check-in
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setManualOverride((current) => !current)}>
                Manual override
              </button>
            </div>
          </label>
        </div>

        {manualOverride ? (
          <>
            {showInterpretedLabel ? <p className="muted">Interpreted readiness (editable)</p> : null}
            <div className="coach-grid">
              <label className="coach-field">
                <span>Sleep (hours)</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={selectedSettings.sleepHours}
                  onChange={(event) => patchSelectedClientSettings({ sleepHours: Number(event.target.value) })}
                />
              </label>

              <label className="coach-field">
                <span>Energy (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedSettings.energy}
                  onChange={(event) => patchSelectedClientSettings({ energy: Number(event.target.value) })}
                />
              </label>

              <label className="coach-field">
                <span>Soreness (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedSettings.soreness}
                  onChange={(event) => patchSelectedClientSettings({ soreness: Number(event.target.value) })}
                />
              </label>

              <label className="coach-field">
                <span>Stress (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedSettings.stress}
                  onChange={(event) => patchSelectedClientSettings({ stress: Number(event.target.value) })}
                />
              </label>
            </div>
          </>
        ) : null}

        {hasReadinessValues ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '12px'
            }}
          >
            <h3 className="card-title" style={{ marginBottom: '6px' }}>
              Expected Program Impact
            </h3>
            {expectedImpactItems.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {expectedImpactItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <button className="btn" disabled={applying} onClick={() => void handleApplyAndRegenerate()}>
          {applying ? 'Applying…' : 'Apply & Regenerate Week'}
        </button>
      </Card>

      <Card>
        <h3 className="card-title">AI Coach Note</h3>
        <p className="notes">{explanation}</p>
      </Card>

      <section className="actions">
        <button className="btn btn-ghost" onClick={() => setView('today')}>
          Today View
        </button>
        <button className="btn btn-ghost" onClick={() => setView('week')}>
          Week View
        </button>
      </section>

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
              onCompleted={(payload) => handleCompleted(payload)}
            />
          )
          : (
            <WeekPage
              week={selectedWeek}
              completionScope={selectedClient.id}
              onCompleted={(payload) => handleCompleted(payload)}
            />
          )
        : null}
    </>
  );
}
