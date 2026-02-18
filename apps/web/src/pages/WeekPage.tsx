import { useState } from 'react';
import Badge from '../components/Badge';
import Card from '../components/Card';
import MarkCompleteButton from '../components/MarkCompleteButton';
import SectionTitle from '../components/SectionTitle';
import type { Day, WeekResponse } from '../types/api';
import { applyExerciseSwap, getSwapCandidates } from '../api/sessions';
import { isLocallyCompleted } from '../utils/localCompletion';
import { formatDayLabel, isToday } from '../utils/dates';
import styles from './WeekPage.module.css';

type Props = {
  week: WeekResponse;
  completionScope: string;
  hideSectionTitle?: boolean;
  compactWeekGrid?: boolean;
  onSwapApplied?:
    | ((
        payload: { date: string; sessionId: string; fromExerciseId: string; toExerciseId: string; toExerciseName: string }
      ) => Promise<void> | void)
    | undefined;
  onCompleted?:
    | ((payload: { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean }) => Promise<void> | void)
    | undefined;
};

function typeLabel(value: string): string {
  if (value === 'zone2') {
    return 'Zone 2';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function emphasisLabel(value: string): string {
  if (value === 'full_body_light') {
    return 'Full Body Light';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function accentColor(day: Day): string {
  if (day.type === 'strength') {
    if (day.emphasis === 'push') {
      return '#16a34a';
    }

    if (day.emphasis === 'pull') {
      return '#7c3aed';
    }

    return '#2563eb';
  }

  if (day.type === 'mobility') {
    return '#f97316';
  }

  if (day.type === 'recovery') {
    return '#64748b';
  }

  return '#0ea5e9';
}

function statusBadgeVariant(status: string | undefined): 'neutral' | 'success' | 'warning' {
  if (status === 'COMPLETED') {
    return 'success';
  }

  if (status === 'PLANNED') {
    return 'warning';
  }

  return 'neutral';
}

function displayStatus(day: Day, weekStart: string, completionScope: string): string {
  const local = isLocallyCompleted({
    scope: completionScope,
    weekStart,
    date: day.date,
    type: day.type,
    sessionId: day.sessionId ?? null
  });

  if (day.status === 'COMPLETED' || local) {
    return 'COMPLETED';
  }

  return day.status || 'PLANNED';
}

export default function WeekPage({
  week,
  completionScope,
  hideSectionTitle = false,
  compactWeekGrid = false,
  onSwapApplied,
  onCompleted
}: Props) {
  const [expandedByDate, setExpandedByDate] = useState<Record<string, boolean>>({});
  const [swappingBySessionId, setSwappingBySessionId] = useState<Record<string, string | null>>({});
  const [swapErrorByDate, setSwapErrorByDate] = useState<Record<string, string>>({});
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  if (week.days.length === 0) {
    return (
      <>
        {!hideSectionTitle ? <SectionTitle title="Your Week" subtitle="Training overview" /> : null}
        <Card>
          <p>No plan yet - generate your first week.</p>
        </Card>
      </>
    );
  }

  const selectedDay = selectedDayDate ? week.days.find((day) => day.date === selectedDayDate) : undefined;

  async function handleQuickSwap(day: Day, exerciseId: string): Promise<void> {
    if (day.type !== 'strength' || !day.sessionId || day.status === 'COMPLETED' || day.status === 'CANCELLED') {
      return;
    }
    const sessionId = day.sessionId;

    if (swappingBySessionId[sessionId]) {
      return;
    }

    setSwapErrorByDate((prev) => ({ ...prev, [day.date]: '' }));
    setSwappingBySessionId((prev) => ({ ...prev, [sessionId]: exerciseId }));

    try {
      const demoClientId =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/coach')
          ? (window.localStorage.getItem('longevity:coachDemo:selectedClient:v1') ?? undefined)
          : undefined;
      const candidates = await getSwapCandidates(sessionId, exerciseId, demoClientId);
      const firstCandidate = candidates[0];
      if (!firstCandidate) {
        throw new Error('No swap candidates available.');
      }

      await applyExerciseSwap(sessionId, exerciseId, firstCandidate.id, demoClientId);
      await onSwapApplied?.({
        date: day.date,
        sessionId,
        fromExerciseId: exerciseId,
        toExerciseId: firstCandidate.id,
        toExerciseName: firstCandidate.name
      });
    } catch (err) {
      setSwapErrorByDate((prev) => ({
        ...prev,
        [day.date]: err instanceof Error ? err.message : 'Unable to swap exercise.'
      }));
    } finally {
      setSwappingBySessionId((prev) => ({ ...prev, [sessionId]: null }));
    }
  }

  function renderDayDetailCard(day: Day, forceExpanded = false): JSX.Element {
    const exercises = day.session?.exercises ?? [];
    const preview = exercises.slice(0, 3);
    const fallback = day.minutes ? `${day.minutes} min cardio` : day.notes || day.session?.notes?.[0] || 'No details';
    const dayStatus = displayStatus(day, week.weekStart, completionScope);
    const isExpanded = forceExpanded || expandedByDate[day.date] === true;
    const canExpand = Boolean(day.notes) || Boolean(day.session?.notes?.length);
    const canSwap = day.type === 'strength' && day.status !== 'COMPLETED' && day.status !== 'CANCELLED' && Boolean(day.sessionId);

    return (
      <Card
        key={day.date}
        compact
        accentColor={accentColor(day)}
        className={`week-day-card${isToday(day.date) ? ' week-day-card-today' : ''}${dayStatus === 'COMPLETED' ? ' week-day-card-complete' : ''}`}
      >
        <div className="card-head">
          <h3 className="card-title-sm">{formatDayLabel(day.date)}</h3>
          <div className="badge-row">
            <Badge variant="info">{typeLabel(day.type)}</Badge>
            {day.type === 'strength' ? <Badge>{emphasisLabel(day.emphasis)}</Badge> : null}
            <Badge variant={statusBadgeVariant(dayStatus)}>
              {dayStatus === 'COMPLETED' ? 'Completed' : dayStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'}
            </Badge>
          </div>
        </div>

        {preview.length > 0 ? (
          <ul className="preview-list">
            {exercises.map((exercise) => (
              <li key={exercise.exerciseId} className="exercise-item">
                <div>
                  <p className="exercise-name">{exercise.name}</p>
                  <p className="exercise-detail">
                    {exercise.sets} x {exercise.reps}
                  </p>
                </div>
                <div className="exercise-actions">
                  <p className="exercise-intensity">Intensity {exercise.intensity}</p>
                  {canSwap ? (
                    <button
                      className="btn btn-ghost btn-swap"
                      onClick={() => void handleQuickSwap(day, exercise.exerciseId)}
                      disabled={Boolean(day.sessionId && swappingBySessionId[day.sessionId])}
                    >
                      {day.sessionId && swappingBySessionId[day.sessionId] === exercise.exerciseId ? 'Swapping...' : 'Swap'}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted preview">{fallback}</p>
        )}

        {isExpanded ? (
          <>
            {day.notes ? <p className="notes">{day.notes}</p> : null}
            {day.session?.notes?.length ? <p className="notes">{day.session.notes.join(' • ')}</p> : null}
          </>
        ) : null}
        {swapErrorByDate[day.date] ? <p className="inline-error">{swapErrorByDate[day.date]}</p> : null}

        {!forceExpanded && canExpand ? (
          <div className="week-card-actions">
            <button
              className="week-expand-btn"
              onClick={() =>
                setExpandedByDate((prev) => ({
                  ...prev,
                  [day.date]: !(prev[day.date] === true)
                }))
              }
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        ) : null}

        <MarkCompleteButton
          scope={completionScope}
          weekStart={week.weekStart}
          date={day.date}
          type={day.type}
          sessionId={day.sessionId}
          exercises={exercises}
          status={dayStatus}
          onCompleted={onCompleted}
        />
      </Card>
    );
  }

  return (
    <>
      {!hideSectionTitle ? <SectionTitle title="Your Week" subtitle="Training overview" /> : null}

      {compactWeekGrid ? (
        <>
          <section className={styles.weekGridOverview}>
            {week.days.map((day) => {
              const dayStatus = displayStatus(day, week.weekStart, completionScope);
              const allExercises = day.session?.exercises ?? [];
              const previewItems = allExercises.slice(0, 3);
              const remainingExercises = Math.max(0, allExercises.length - 3);
              const fallback = day.minutes ? `${day.minutes} min cardio` : day.notes || day.session?.notes?.[0] || 'No details';

              return (
                <button
                  key={day.date}
                  type="button"
                  className={`${styles.dayCard}${isToday(day.date) ? ` ${styles.dayCardToday}` : ''}${dayStatus === 'COMPLETED' ? ` ${styles.dayCardComplete}` : ''}`}
                  onClick={() => setSelectedDayDate(day.date)}
                >
                  <div className={styles.dayCardHeader}>
                    <p className={styles.dayCardDate}>{formatDayLabel(day.date)}</p>
                  </div>
                  <div className={styles.dayCardMeta}>
                    <div className={styles.dayCardBadges}>
                      <Badge variant="info">{typeLabel(day.type)}</Badge>
                    </div>
                  </div>
                  <div className={styles.dayCardStatus}>
                    <div className={styles.dayCardBadges}>
                      <Badge variant={statusBadgeVariant(dayStatus)}>
                        {dayStatus === 'COMPLETED' ? 'Completed' : dayStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {previewItems.length > 0 ? (
                    <>
                      <ul className={styles.dayCardPreview}>
                        {previewItems.map((exercise) => (
                          <li key={exercise.exerciseId}>{exercise.name}</li>
                        ))}
                      </ul>
                      {remainingExercises > 0 ? <p className={styles.dayCardMore}>+ {remainingExercises} more...</p> : null}
                    </>
                  ) : (
                    <p className={styles.dayCardFallback}>{fallback}</p>
                  )}
                </button>
              );
            })}
          </section>

          {selectedDay ? (
            <div className="week-modal-overlay" role="presentation" onClick={() => setSelectedDayDate(null)}>
              <div className="week-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <div className="week-modal-header">
                  <div>
                    <h3 className="card-title">{formatDayLabel(selectedDay.date)}</h3>
                    <div className="badge-row">
                      <Badge variant="info">{typeLabel(selectedDay.type)}</Badge>
                      {selectedDay.type === 'strength' ? <Badge>{emphasisLabel(selectedDay.emphasis)}</Badge> : null}
                      <Badge variant={statusBadgeVariant(displayStatus(selectedDay, week.weekStart, completionScope))}>
                        {displayStatus(selectedDay, week.weekStart, completionScope) === 'COMPLETED'
                          ? 'Completed'
                          : displayStatus(selectedDay, week.weekStart, completionScope) === 'CANCELLED'
                            ? 'Cancelled'
                            : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  <button className="week-modal-close" type="button" onClick={() => setSelectedDayDate(null)}>
                    Close
                  </button>
                </div>

                {renderDayDetailCard(selectedDay, true)}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <section className="week-list">{week.days.map((day) => renderDayDetailCard(day))}</section>
      )}
    </>
  );
}
