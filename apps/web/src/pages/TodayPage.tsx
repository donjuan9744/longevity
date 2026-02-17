import Badge from '../components/Badge';
import Card from '../components/Card';
import MarkCompleteButton from '../components/MarkCompleteButton';
import SectionTitle from '../components/SectionTitle';
import type { Day, StrengthDay, WeekResponse } from '../types/api';
import { isLocallyCompleted } from '../utils/localCompletion';
import { isToday } from '../utils/dates';

type Props = {
  week: WeekResponse;
  completionScope: string;
  onCancel: (sessionId: string) => void;
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

  if (status === 'CANCELLED') {
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
    return `${day.minutes} min`;
  }

  return day.notes || day.session?.notes?.[0] || 'Planned session';
}

function nonStrengthTitle(day: Day): string {
  if (day.type === 'zone2' && day.session?.exercises?.[0]?.name) {
    return day.session.exercises[0].name;
  }

  return `${titleCaseType(day.type)} session`;
}

export default function TodayPage({ week, completionScope, onCancel, onCompleted }: Props) {
  const today = week.days.find((day) => isToday(day.date));

  if (!today) {
    return (
      <>
        <SectionTitle title="Longevity Coach" subtitle="Today's training" />
        <Card>
          <p className="muted">No session found for today in this week.</p>
        </Card>
      </>
    );
  }

  const sessionExercises = today.session?.exercises ?? [];
  const sessionNotes = today.session?.notes ?? [];
  const todayStatus = displayStatus(today, week.weekStart, completionScope);
  const canCancel = today.type === 'strength' && today.sessionId && todayStatus !== 'CANCELLED';

  return (
    <>
      <SectionTitle title="Longevity Coach" subtitle="Today's training" />
      <Card accentColor="#2563eb">
        <div className="card-head">
          <h3 className="card-title">Today</h3>
          <div className="badge-row">
            <Badge variant="info">{titleCaseType(today.type)}</Badge>
            {today.type === 'strength' ? <Badge>{emphasisLabel(today.emphasis)}</Badge> : null}
            <Badge variant={badgeVariantFromStatus(todayStatus)}>{todayStatus}</Badge>
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
                  <p className="exercise-intensity">Intensity {exercise.intensity}</p>
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
                <p className="exercise-detail">{detailLine(today)}</p>
              </div>
            </li>
          </ul>
        )}

        {today.notes ? <p className="notes">{today.notes}</p> : null}
        {sessionNotes.length > 0 ? <p className="notes">{sessionNotes.join(' • ')}</p> : null}

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
    </>
  );
}
