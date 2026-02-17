import { useState } from 'react';
import Badge from '../components/Badge';
import Card from '../components/Card';
import MarkCompleteButton from '../components/MarkCompleteButton';
import SectionTitle from '../components/SectionTitle';
import type { Day, WeekResponse } from '../types/api';
import { isLocallyCompleted } from '../utils/localCompletion';
import { formatDayLabel } from '../utils/dates';

type Props = {
  week: WeekResponse;
  completionScope: string;
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

export default function WeekPage({ week, completionScope, onCompleted }: Props) {
  const [expandedByDate, setExpandedByDate] = useState<Record<string, boolean>>({});

  if (week.days.length === 0) {
    return (
      <>
        <SectionTitle title="Your Week" subtitle="Training overview" />
        <Card>
          <p>No plan yet - generate your first week.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionTitle title="Your Week" subtitle="Training overview" />
      <section className="week-list">
        {week.days.map((day) => {
          const exercises = day.session?.exercises ?? [];
          const preview = exercises.slice(0, 3);
          const moreCount = exercises.length > 3 ? exercises.length - 3 : 0;
          const fallback = day.minutes ? `${day.minutes} min` : day.notes || day.session?.notes?.[0] || 'No details';
          const dayStatus = displayStatus(day, week.weekStart, completionScope);
          const isExpanded = expandedByDate[day.date] === true;
          const canExpand = exercises.length > 0 || Boolean(day.notes) || Boolean(day.session?.notes?.length);

          return (
            <Card key={day.date} compact accentColor={accentColor(day)}>
              <div className="card-head">
                <h3 className="card-title-sm">{formatDayLabel(day.date)}</h3>
                <div className="badge-row">
                  <Badge variant="info">{typeLabel(day.type)}</Badge>
                  {day.type === 'strength' ? <Badge>{emphasisLabel(day.emphasis)}</Badge> : null}
                  <Badge variant={statusBadgeVariant(dayStatus)}>{dayStatus}</Badge>
                </div>
              </div>

              {isExpanded ? (
                <>
                  {exercises.length > 0 ? (
                    <ul className="preview-list">
                      {exercises.map((exercise) => (
                        <li key={exercise.exerciseId} className="muted">
                          {exercise.name} {exercise.sets} x {exercise.reps}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted preview">{fallback}</p>
                  )}
                  {day.notes ? <p className="notes">{day.notes}</p> : null}
                  {day.session?.notes?.length ? <p className="notes">{day.session.notes.join(' • ')}</p> : null}
                </>
              ) : preview.length > 0 ? (
                <ul className="preview-list">
                  {preview.map((exercise) => (
                    <li key={exercise.exerciseId} className="muted">
                      {exercise.name} {exercise.sets} x {exercise.reps}
                    </li>
                  ))}
                  {moreCount > 0 ? <li className="muted">+ {moreCount} more</li> : null}
                </ul>
              ) : (
                <p className="muted preview">{fallback}</p>
              )}

              {canExpand ? (
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
                    {isExpanded ? 'Collapse' : 'Expand'}
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
        })}
      </section>
    </>
  );
}
