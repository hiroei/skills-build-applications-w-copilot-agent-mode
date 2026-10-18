import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const existingUser = await User.findOne({ email }).select('_id team');

  if (existingUser?.team && existingUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: existingUser.team }, { $pull: { members: existingUser._id } });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });

  return user;
}

async function upsertDemoTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function seed() {
  await connectDatabase();

  try {
    const octocats = await upsertDemoTeam('Octocats', 'Mona');
    const robocats = await upsertDemoTeam('Robocats', 'Hubot');
    const codecats = await upsertDemoTeam('Codecats', 'Copilot');
    const trailblazers = await upsertDemoTeam('Trailblazers', 'Trail');

    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');
    const asha = await upsertDemoUser('Asha', 'asha@example.com', codecats._id, 'mobility');
    const leo = await upsertDemoUser('Leo', 'leo@example.com', trailblazers._id, 'balance');

    const runAt = new Date('2026-01-10T12:00:00.000Z');
    const cycleAt = new Date('2026-01-11T12:00:00.000Z');
    const strengthAt = new Date('2026-01-12T12:00:00.000Z');

    await Activity.updateOne(
      { user: mona._id, team: octocats._id, type: 'run', occurredAt: runAt },
      {
        $set: {
          user: mona._id,
          team: octocats._id,
          type: 'run',
          minutes: 40,
          points: 40,
          occurredAt: runAt,
        },
      },
      { upsert: true },
    );

    await Activity.updateOne(
      { user: hubot._id, team: robocats._id, type: 'cycle', occurredAt: cycleAt },
      {
        $set: {
          user: hubot._id,
          team: robocats._id,
          type: 'cycle',
          minutes: 25,
          points: 25,
          occurredAt: cycleAt,
        },
      },
      { upsert: true },
    );

    await Activity.updateOne(
      { user: asha._id, team: codecats._id, type: 'strength', occurredAt: strengthAt },
      {
        $set: {
          user: asha._id,
          team: codecats._id,
          type: 'strength',
          minutes: 30,
          points: 30,
          occurredAt: strengthAt,
        },
      },
      { upsert: true },
    );

    await Workout.updateOne(
      { title: 'Intervals' },
      { $set: { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' } },
      { upsert: true },
    );

    await Workout.updateOne(
      { title: 'Strength Circuit' },
      { $set: { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' } },
      { upsert: true },
    );

    await Workout.updateOne(
      { title: 'Mobility Flow' },
      { $set: { title: 'Mobility Flow', focus: 'mobility', minutes: 20, difficulty: 'easy' } },
      { upsert: true },
    );

    await Team.updateOne({ _id: octocats._id }, { $addToSet: { members: { $each: [mona._id] } } });
    await Team.updateOne({ _id: robocats._id }, { $addToSet: { members: { $each: [hubot._id] } } });
    await Team.updateOne({ _id: codecats._id }, { $addToSet: { members: { $each: [asha._id] } } });
    await Team.updateOne({ _id: trailblazers._id }, { $addToSet: { members: { $each: [leo._id] } } });
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
