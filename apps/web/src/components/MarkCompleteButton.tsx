import { useEffect, useMemo, useState } from 'react';
import { completeSession, type SessionResultInput } from '../api/sessions';
import type { SessionExercise } from '../types/api';
import { isLocallyCompleted, markLocallyCompleted } from '../utils/localCompletion';

type Props = {
  scope: string;
  weekStart: string;
  date: string;
  type: 'strength' | 'mobility' | 'zone2' | 'recovery';
  sessionId: string | undefined;
  exercises: SessionExercise[] | undefined;
  status: string | undefined;
  onCompleted:
    | ((payload: { date: string; type: 'strength' | 'mobility' | 'zone2' | 'recovery'; local: boolean }) => Promise<void> | void)
    | undefined;
};

export default function MarkCompleteButton({ scope, weekStart, date, type, sessionId, exercises = [], status, onCompleted }: Props) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState('');
  const supportsLocalCompletion = type !== 'strength';
  const completionInput = useMemo(
    () => ({
      scope,
      weekStart,
      date,
      type,
      sessionId: sessionId ?? null
    }),
    [scope, weekStart, date, type, sessionId]
  );
  const [isLocallyComplete, setIsLocallyComplete] = useState(() =>
    isLocallyCompleted(completionInput)
  );

  useEffect(() => {
    setIsLocallyComplete(isLocallyCompleted(completionInput));
  }, [completionInput]);

  const isStrength = type === 'strength';
  const hasSessionId = typeof sessionId === 'string' && sessionId.length > 0;
  const canAttemptCompletion = supportsLocalCompletion || (isStrength && hasSessionId);
  const isServerComplete = isStrength && status === 'COMPLETED';
  const isComplete = isServerComplete || isLocallyComplete;
  const statusLabel = useMemo(() => (isComplete ? 'COMPLETED' : 'PLANNED'), [isComplete]);

  const exerciseResults: SessionResultInput[] = useMemo(
    () =>
      exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        reps: exercise.reps
      })),
    [exercises]
  );

  async function handleComplete(): Promise<void> {
    if (isComplete) {
      return;
    }

    if (supportsLocalCompletion) {
      markLocallyCompleted(completionInput);
      setIsLocallyComplete(true);
      setError('');
      await onCompleted?.({ date, type, local: true });
      return;
    }

    if (!isStrength || !hasSessionId || !sessionId) {
      return;
    }

    setIsCompleting(true);
    setError('');

    try {
      const demoClientId =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/coach')
          ? (window.localStorage.getItem('longevity:coachDemo:selectedClient:v1') ?? undefined)
          : undefined;
      await completeSession(sessionId, exerciseResults, demoClientId);
      await onCompleted?.({ date, type, local: false });
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Unable to mark workout complete. Please try again.');
      }
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="complete-block">
      <p className="status-line">
        Status: <span className={isComplete ? 'status-complete' : 'status-planned'}>{statusLabel}</span>
      </p>
      <button
        className="btn btn-primary-action"
        onClick={() => void handleComplete()}
        disabled={isCompleting || isComplete || !canAttemptCompletion}
      >
        {isComplete ? 'Completed' : isCompleting ? 'Completing...' : 'Mark Complete'}
      </button>
      {!isStrength && isLocallyComplete ? <p className="helper-text">Completed locally</p> : null}
      {error ? <p className="inline-error">{error}</p> : null}
    </div>
  );
}
