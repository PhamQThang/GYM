import { useEffect, useState } from 'react';
import { WorkoutLogForm } from '../../components/views/workout/WorkoutLogForm';
import { loadWorkoutExercises, saveClientWorkout } from '../../lib/repositories/client-workout';

type Exercise = Awaited<ReturnType<typeof loadWorkoutExercises>>[number];

export function ClientWorkoutForm({ clientId, onClose, onSave }: {
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [catalog, setCatalog] = useState<Exercise[] | 'error' | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void loadWorkoutExercises(controller.signal)
      .then(rows => { if (!controller.signal.aborted) setCatalog(rows); })
      .catch(() => { if (!controller.signal.aborted) setCatalog('error'); });
    return () => controller.abort();
  }, [attempt]);

  return <WorkoutLogForm catalog={catalog} onClose={onClose}
    onRetryCatalog={() => { setCatalog(null); setAttempt(value => value + 1); }}
    onSave={async workout => {
      await saveClientWorkout({
        p_workout_id: workout.id, p_client_id: clientId, p_recorded_at: workout.recordedAt,
        p_note: workout.note, p_sets: workout.sets,
      });
      onSave();
    }} />;
}
