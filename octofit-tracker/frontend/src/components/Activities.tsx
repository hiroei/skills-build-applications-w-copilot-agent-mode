import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then((payload) => {
        if (!active) return;
        setActivities(payload.activities ?? []);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load activities');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." isLoading={isLoading} error={error} items={activities} emptyMessage="No activities" renderItem={(activity) => <span>{activity.type ?? 'Activity'}{activity.minutes != null ? ` · ${activity.minutes} min` : ''}</span>} />;
}
