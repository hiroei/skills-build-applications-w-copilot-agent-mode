import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (!active) return;
        setLeaderboard(payload.leaderboard ?? []);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load leaderboard');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." isLoading={isLoading} error={error} items={leaderboard} emptyMessage="No leaderboard" renderItem={(entry) => <span>{entry.teamName ?? 'Team'} · {entry.totalPoints ?? 0} pts</span>} />;
}
