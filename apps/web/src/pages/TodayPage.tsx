import type { StrengthDay, WeekResponse } from '../types/api';
import { isToday } from '../utils/dates';
import MarkCompleteButton from '../components/MarkCompleteButton';

type Props = {
  week: WeekResponse;
  onCancel: (sessionId: string) => void;
  onRefreshWeek?: () => Promise<void> | void;
};

function titleCaseType(value: string): string {
  if (value === 'zone2') {
    return 'Zone2';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function emphasisLabel(value: StrengthDay['emphasis']): string {
  if (value === 'full_body_light') {
    return 'Full Body Light';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function TodayPage({ week, onCancel, onRefreshWeek }: Props) {
  const today = week.days.find((day) => isToday(day.date));

  if (!today) {
    return (
      <section className="card">
        <h2 className="card-title">Today</h2>
        <p className="muted">No session found for today in this week.</p>
      </section>
    );
  }

  const sessionExercises = today.session?.exercises ?? [];
  const sessionNotes = today.session?.notes ?? [];
  const canCancel = today.type === 'strength' && today.sessionId && today.status !== 'CANCELLED';

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Today</h2>
        <span className="badge">{titleCaseType(today.type)}</span>
      </div>

      {today.type === 'strength' ? <p className="emphasis">{emphasisLabel(today.emphasis)}</p> : null}

      {sessionExercises.length > 0 ? (
        <ul className="exercise-list">
          {sessionExercises.map((exercise) => (
            <li key={exercise.exerciseId} className="exercise-row">
              <span>{exercise.name}</span>
              <span className="muted">
                {exercise.sets} x {exercise.reps}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No exercises listed.</p>
      )}

      {today.notes ? <p className="notes">{today.notes}</p> : null}
      {sessionNotes.length > 0 ? <p className="notes">{sessionNotes.join(' • ')}</p> : null}

      <MarkCompleteButton
        date={today.date}
        sessionId={today.sessionId}
        exercises={sessionExercises}
        status={today.status}
        onCompleted={onRefreshWeek}
      />

      {canCancel ? (
        <button className="btn btn-danger" onClick={() => onCancel(today.sessionId!)}>
          Cancel Workout
        </button>
      ) : null}
    </section>
  );
}
