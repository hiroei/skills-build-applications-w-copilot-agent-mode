import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then((payload) => {
        if (!active) return;
        setTeams(payload.teams ?? []);
        setError(null);
      })
      .catch((caughtError: unknown) => {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load teams');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." isLoading={isLoading} error={error} items={teams} emptyMessage="No teams" renderItem={(team) => <span>{team.name ?? 'Team'}{team.members && team.members.length > 0 ? ` · ${team.members.length} members` : ''}</span>} />;
}
