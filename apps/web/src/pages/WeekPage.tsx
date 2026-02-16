import type { WeekResponse } from '../types/api';
import { formatDayLabel } from '../utils/dates';
import MarkCompleteButton from '../components/MarkCompleteButton';

type Props = {
  week: WeekResponse;
  onRefreshWeek?: () => Promise<void> | void;
};

function typeLabel(value: string): string {
  if (value === 'zone2') {
    return 'Zone2';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function emphasisLabel(value: string): string {
  if (value === 'full_body_light') {
    return 'Full Body Light';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function WeekPage({ week, onRefreshWeek }: Props) {
  return (
    <section className="week-list">
      {week.days.map((day) => {
        const exercises = day.session?.exercises ?? [];
        const exercisePreview = exercises.slice(0, 3).map((exercise) => exercise.name);
        const detail =
          exercisePreview.length > 0
            ? exercisePreview.join(' • ')
            : day.minutes
              ? `${day.minutes} min`
              : day.notes || day.session?.notes?.[0] || 'No details';

        return (
          <article key={day.date} className="card card-compact">
            <div className="card-head">
              <h3 className="card-title-sm">{formatDayLabel(day.date)}</h3>
              <span className="badge">{typeLabel(day.type)}</span>
            </div>

            {day.type === 'strength' ? <p className="emphasis">{emphasisLabel(day.emphasis)}</p> : null}
            {day.type === 'strength' && day.status === 'CANCELLED' ? <p className="cancelled">Cancelled</p> : null}

            <p className="muted preview">{detail}</p>

            <MarkCompleteButton
              date={day.date}
              sessionId={day.sessionId}
              exercises={exercises}
              status={day.status}
              onCompleted={onRefreshWeek}
            />
          </article>
        );
      })}
    </section>
  );
}
