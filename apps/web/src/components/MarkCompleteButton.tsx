import { useEffect, useMemo, useState } from 'react';
import { completeSession, type SessionResultInput } from '../api/sessions';
import type { SessionExercise } from '../types/api';
import { isDayComplete, setDayComplete } from '../utils/completion';

type Props = {
  date: string;
  sessionId: string | undefined;
  exercises: SessionExercise[] | undefined;
  status: string | undefined;
  onCompleted: (() => Promise<void> | void) | undefined;
};

export default function MarkCompleteButton({ date, sessionId, exercises = [], status, onCompleted }: Props) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState('');
  const [isLocallyComplete, setIsLocallyComplete] = useState(() => isDayComplete(date));

  useEffect(() => {
    setIsLocallyComplete(isDayComplete(date));
  }, [date]);

  const hasSessionId = typeof sessionId === 'string' && sessionId.length > 0;
  const isServerComplete = status === 'COMPLETED';
  const isComplete = isServerComplete || isLocallyComplete;
  const statusLabel = useMemo(() => (isComplete ? 'Completed' : 'Planned'), [isComplete]);

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

    setIsCompleting(true);
    setError('');

    try {
      if (hasSessionId && sessionId) {
        await completeSession(sessionId, exerciseResults);
      }
      setDayComplete(date, true);
      setIsLocallyComplete(true);
      await onCompleted?.();
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
    <>
      <p className="status-line">
        Status: <span className={isComplete ? 'status-complete' : 'status-planned'}>{statusLabel}</span>
      </p>
      <button className="btn btn-primary-action" onClick={() => void handleComplete()} disabled={isCompleting || isComplete}>
        {isComplete ? 'Completed ✓' : isCompleting ? 'Completing...' : 'Mark Complete'}
      </button>
      {error ? <p className="inline-error">{error}</p> : null}
    </>
  );
}
