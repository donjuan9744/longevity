import { useState } from 'react';
import Badge from '../components/Badge';
import Card from '../components/Card';
import MarkCompleteButton from '../components/MarkCompleteButton';
import SectionTitle from '../components/SectionTitle';
import type { Day, StrengthDay, WeekResponse } from '../types/api';
import { applyExerciseSwap, getSwapCandidates } from '../api/sessions';
import { isLocallyCompleted } from '../utils/localCompletion';
import { formatDayLabel, isToday } from '../utils/dates';

type Props = {
  week: WeekResponse;
  completionScope: string;
  hideSectionTitle?: boolean;
  onCancel: (sessionId: string) => void;
  onSwapApplied?:
    | ((
        payload: { date: string; sessionId: string; fromExerciseId: string; toExerciseId: string; toExerciseName: string }
      ) => Promise<void> | void)
    | undefined;
  onCompleted?:
    | ((payload: { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean }) => Promise<void> | void)
    | undefined;
};

function titleCaseType(value: string): string {
  if (value === 'zone2') {
    return 'Zone 2';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function emphasisLabel(value: StrengthDay['emphasis']): string {
  if (value === 'full_body_light') {
    return 'Full Body Light';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function badgeVariantFromStatus(status: Day['status']): 'success' | 'warning' | 'neutral' {
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

function detailLine(day: Day): string {
  if (day.minutes) {
    return `${day.minutes} min cardio`;
  }

  return day.notes || day.session?.notes?.[0] || 'Planned session';
}

function nonStrengthTitle(day: Day): string {
  if (day.type === 'zone2' && day.session?.exercises?.[0]?.name) {
    return day.session.exercises[0].name;
  }

  return `${titleCaseType(day.type)} session`;
}

function athleteDateLabel(dateIso: string): string {
  const text = new Date(`${dateIso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return text.replace(', ', ' · ');
}

export default function TodayPage({ week, completionScope, hideSectionTitle = false, onCancel, onSwapApplied, onCompleted }: Props) {
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [swapError, setSwapError] = useState('');
  const isCoachMode = typeof window !== 'undefined' && window.location.pathname.startsWith('/coach');
  const isAthleteView = !isCoachMode && !hideSectionTitle;
  const todayMatch = week.days.find((day) => isToday(day.date));

  if (!todayMatch) {
    return (
      <>
        {!hideSectionTitle ? <SectionTitle title="Longevity Coach" subtitle="Today's training" /> : null}
        <Card>
          <p className="muted">No session found for today in this week.</p>
        </Card>
      </>
    );
  }

  const today = todayMatch;
  const sessionExercises = today.session?.exercises ?? [];
  const sessionNotes = today.session?.notes ?? [];
  const todayStatus = displayStatus(today, week.weekStart, completionScope);
  const totalExercises = sessionExercises.length;
  const completedExercises = todayStatus === 'COMPLETED' ? totalExercises : 0;
  const canCancel = today.type === 'strength' && today.sessionId && todayStatus !== 'CANCELLED';
  const canSwap = today.type === 'strength' && Boolean(today.sessionId) && todayStatus === 'PLANNED';

  async function handleQuickSwap(exerciseId: string): Promise<void> {
    if (!today.sessionId || !canSwap || swappingExerciseId) {
      return;
    }

    setSwapError('');
    setSwappingExerciseId(exerciseId);

    try {
      const demoClientId =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/coach')
          ? (window.localStorage.getItem('longevity:coachDemo:selectedClient:v1') ?? undefined)
          : undefined;
      const candidates = await getSwapCandidates(today.sessionId, exerciseId, demoClientId);
      const firstCandidate = candidates[0];
      if (!firstCandidate) {
        throw new Error('No swap candidates available.');
      }

      await applyExerciseSwap(today.sessionId, exerciseId, firstCandidate.id, demoClientId);
      await onSwapApplied?.({
        date: today.date,
        sessionId: today.sessionId,
        fromExerciseId: exerciseId,
        toExerciseId: firstCandidate.id,
        toExerciseName: firstCandidate.name
      });
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Unable to swap exercise.');
    } finally {
      setSwappingExerciseId(null);
    }
  }

  return (
    <>
      {!hideSectionTitle && !isAthleteView ? <SectionTitle title="Longevity Coach" subtitle="Today's training" /> : null}
      {isAthleteView ? (
        <header className="athlete-today-header">
          <h2>Today&apos;s Training</h2>
          <p className="athlete-today-subtext">{athleteDateLabel(today.date)}</p>
          <div className="athlete-today-meta">
            <Badge variant="info">{titleCaseType(today.type)}</Badge>
            {today.type === 'strength' ? <Badge>{emphasisLabel(today.emphasis)}</Badge> : null}
            <Badge variant={badgeVariantFromStatus(todayStatus)}>
              {todayStatus === 'COMPLETED' ? 'Completed' : todayStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'}
            </Badge>
          </div>
          <p className="athlete-today-progress muted">
            {todayStatus === 'COMPLETED' ? 'Session Completed' : `Progress: ${completedExercises} / ${totalExercises} exercises`}
          </p>
        </header>
      ) : null}
      {isAthleteView ? (
        <section className="athlete-today-layout">
          <Card className="athlete-session-card">
            <div className="card-head">
              <h3 className="card-title">{formatDayLabel(today.date)}</h3>
            </div>

            {today.type === 'strength' ? (
              sessionExercises.length > 0 ? (
                <div className="athlete-exercise-wrap">
                  <ul className="exercise-list athlete-exercise-list">
                    {sessionExercises.map((exercise) => (
                      <li key={exercise.exerciseId} className="athlete-exercise-row">
                        <div className="athlete-exercise-main">
                          <p className="exercise-name athlete-exercise-name">{exercise.name}</p>
                          <p className="exercise-detail athlete-exercise-detail">
                            {exercise.sets} x {exercise.reps}
                          </p>
                        </div>
                        <div className="athlete-exercise-actions">
                          <p className="athlete-intensity-pill">Intensity {exercise.intensity}</p>
                          {canSwap ? (
                            <button
                              className="btn btn-ghost athlete-swap-btn"
                              onClick={() => void handleQuickSwap(exercise.exerciseId)}
                              disabled={Boolean(swappingExerciseId)}
                            >
                              {swappingExerciseId === exercise.exerciseId ? 'Swapping...' : 'Swap'}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted">No exercises listed.</p>
              )
            ) : (
              <div className="athlete-exercise-wrap">
                <ul className="exercise-list athlete-exercise-list">
                  <li className="athlete-exercise-row athlete-exercise-row-single">
                    <div>
                      <p className="exercise-name athlete-exercise-name">{nonStrengthTitle(today)}</p>
                      <p className="exercise-detail athlete-exercise-detail today-minutes">{detailLine(today)}</p>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {today.notes ? <p className="notes">{today.notes}</p> : null}
            {sessionNotes.length > 0 ? <p className="notes">{sessionNotes.join(' • ')}</p> : null}
            {swapError ? <p className="inline-error">{swapError}</p> : null}
          </Card>

          <Card className="athlete-meta-card">
            <div className="athlete-meta-block">
              <p className="athlete-meta-label">Session Status</p>
              <div className="athlete-today-meta">
                <Badge variant={badgeVariantFromStatus(todayStatus)}>
                  {todayStatus === 'COMPLETED' ? 'Completed' : todayStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'}
                </Badge>
              </div>
            </div>
            <div className="athlete-meta-block">
              <p className="athlete-meta-label">Tags</p>
              <div className="athlete-today-meta">
                <Badge variant="info">{titleCaseType(today.type)}</Badge>
                {today.type === 'strength' ? <Badge>{emphasisLabel(today.emphasis)}</Badge> : null}
              </div>
            </div>
            <div className="athlete-meta-block">
              <p className="athlete-meta-label">Progress</p>
              <p className="athlete-today-progress muted">
                {todayStatus === 'COMPLETED' ? 'Session Completed' : `Progress: ${completedExercises} / ${totalExercises} exercises`}
              </p>
            </div>

            <MarkCompleteButton
              scope={completionScope}
              weekStart={week.weekStart}
              date={today.date}
              type={today.type}
              sessionId={today.sessionId}
              exercises={sessionExercises}
              status={todayStatus}
              onCompleted={onCompleted}
              buttonLabel="Complete Session"
              buttonClassName="athlete-complete-btn"
            />

            {canCancel ? (
              <button className="btn btn-danger" onClick={() => onCancel(today.sessionId!)}>
                Cancel Workout
              </button>
            ) : null}
          </Card>
        </section>
      ) : (
        <Card accentColor="#2563eb">
          <div className="card-head">
            <h3 className="card-title">Today Session - {formatDayLabel(today.date)}</h3>
            <div className="badge-row">
              <Badge variant="info">{titleCaseType(today.type)}</Badge>
              {today.type === 'strength' ? <Badge>{emphasisLabel(today.emphasis)}</Badge> : null}
              <Badge variant={badgeVariantFromStatus(todayStatus)}>
                {todayStatus === 'COMPLETED' ? 'Completed' : todayStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'}
              </Badge>
            </div>
          </div>

          {today.type === 'strength' ? (
            sessionExercises.length > 0 ? (
              <ul className="exercise-list">
                {sessionExercises.map((exercise) => (
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
                          onClick={() => void handleQuickSwap(exercise.exerciseId)}
                          disabled={Boolean(swappingExerciseId)}
                        >
                          {swappingExerciseId === exercise.exerciseId ? 'Swapping...' : 'Swap'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No exercises listed.</p>
            )
          ) : (
            <ul className="exercise-list">
              <li className="exercise-item">
                <div>
                  <p className="exercise-name">{nonStrengthTitle(today)}</p>
                  <p className="exercise-detail today-minutes">{detailLine(today)}</p>
                </div>
              </li>
            </ul>
          )}

          {today.notes ? <p className="notes">{today.notes}</p> : null}
          {sessionNotes.length > 0 ? <p className="notes">{sessionNotes.join(' • ')}</p> : null}
          {swapError ? <p className="inline-error">{swapError}</p> : null}

          <MarkCompleteButton
            scope={completionScope}
            weekStart={week.weekStart}
            date={today.date}
            type={today.type}
            sessionId={today.sessionId}
            exercises={sessionExercises}
            status={todayStatus}
            onCompleted={onCompleted}
          />

          {canCancel ? (
            <button className="btn btn-danger" onClick={() => onCancel(today.sessionId!)}>
              Cancel Workout
            </button>
          ) : null}
        </Card>
      )}
    </>
  );
}
