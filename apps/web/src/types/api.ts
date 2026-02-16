export type SessionExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  intensity: number;
};

type DayType = 'strength' | 'mobility' | 'zone2' | 'recovery';
type StrengthEmphasis = 'push' | 'pull' | 'lower' | 'full_body_light';
type SessionStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED' | string;

type DayBase = {
  date: string;
  type: DayType;
  sessionId?: string;
  status?: SessionStatus;
  minutes?: number;
  notes?: string;
  session?: {
    exercises: SessionExercise[];
    notes?: string[];
  };
};

export type StrengthDay = DayBase & {
  type: 'strength';
  emphasis: StrengthEmphasis;
  sessionId?: string;
  status?: SessionStatus;
  session: {
    exercises: SessionExercise[];
    notes?: string[];
  };
};

export type MobilityDay = DayBase & { type: 'mobility' };
export type Zone2Day = DayBase & { type: 'zone2' };
export type RecoveryDay = DayBase & { type: 'recovery' };

export type Day = StrengthDay | MobilityDay | Zone2Day | RecoveryDay;

export type WeekResponse = {
  weekStart: string;
  weekEnd: string;
  days: Day[];
};
