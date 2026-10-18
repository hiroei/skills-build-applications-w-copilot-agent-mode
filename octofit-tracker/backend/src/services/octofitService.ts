import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function requireValidObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw new HttpError(400, `Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Activity payload is required');
  }

  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;

  if (userId === undefined || teamId === undefined || type === undefined || minutes === undefined) {
    throw new HttpError(400, 'Activity requires userId, teamId, type, and minutes');
  }

  const userObjectId = requireValidObjectId(userId, 'userId');
  const teamObjectId = requireValidObjectId(teamId, 'teamId');

  const [user, team] = await Promise.all([
    User.findById(userObjectId),
    Team.findById(teamObjectId),
  ]);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!team) {
    throw new HttpError(404, 'Team not found');
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw new HttpError(400, 'Activity type is required');
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw new HttpError(400, 'Minutes must be a positive number');
  }

  const activity = await Activity.create({
    user: userObjectId,
    team: teamObjectId,
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Team payload is required');
  }

  const body = input as Record<string, unknown>;
  const { name, mascot, members } = body;

  if (typeof name !== 'string' || !name.trim()) {
    throw new HttpError(400, 'Team name is required');
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw new HttpError(400, 'Team mascot is required');
  }

  const normalizedMembers = Array.isArray(members)
    ? members.map((memberId) => {
        if (typeof memberId === 'string' || memberId instanceof mongoose.Types.ObjectId) {
          return new mongoose.Types.ObjectId(memberId.toString());
        }
        throw new HttpError(400, 'Team members must be valid user IDs');
      })
    : [];

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const activities = await Activity.find().lean();

  const totalsByTeam = new Map<string, { teamName: string; totalPoints: number }>();

  for (const activity of activities) {
    const teamId = activity.team?.toString();
    if (!teamId) continue;

    const team = await Team.findById(teamId).lean();
    const teamName = team?.name ?? 'Unknown Team';
    const totalPoints = Number(activity.points ?? 0);
    const previous = totalsByTeam.get(teamId) ?? { teamName, totalPoints: 0 };

    totalsByTeam.set(teamId, {
      teamName,
      totalPoints: previous.totalPoints + totalPoints,
    });
  }

  const leaderboard = Array.from(totalsByTeam.entries())
    .map(([teamId, entry]) => ({
      teamId,
      teamName: entry.teamName,
      totalPoints: entry.totalPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName));

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
    throw new HttpError(400, 'User email is required');
  }

  const user = await User.findOne({ email: userEmail.trim() }).lean();
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const recentTypes = recentActivities.map((activity) => String(activity.type ?? '').toLowerCase());
  const goal = String(user.fitnessGoal ?? '').toLowerCase();

  const focusCandidates = new Set<string>();
  if (goal) focusCandidates.add(goal);
  for (const activityType of recentTypes) {
    if (activityType) focusCandidates.add(activityType);
  }

  const workouts = await Workout.find().lean();

  const scored = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      const score = focusCandidates.has(focus) ? 3 : recentTypes.includes(focus) ? 2 : 0;

      let reason = `Recommended for your ${goal || 'recent activity'} pattern.`;
      if (focusCandidates.has(focus)) {
        reason = `Your ${goal || 'recent activity'} suggests ${focus} training.`;
      } else if (recentTypes.length > 0) {
        reason = `Your recent activity included ${recentTypes[0]} and this workout matches that pace.`;
      }

      return {
        ...workout,
        focus,
        reason,
        score,
      };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  if (scored.length === 0) {
    return [];
  }

  return scored.map(({ _id, title, focus, minutes, difficulty, reason }) => ({
    _id,
    title,
    focus,
    minutes,
    difficulty,
    reason,
  }));
}

export { User };
