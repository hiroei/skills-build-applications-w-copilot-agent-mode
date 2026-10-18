import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; focus?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load workout suggestions');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." isLoading={isLoading} error={error} items={suggestions} emptyMessage="No workout suggestions" renderItem={(suggestion) => <span>{suggestion.title ?? 'Workout'}{suggestion.focus ? ` · ${suggestion.focus}` : ''}</span>} />;
}
