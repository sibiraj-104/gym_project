import mongoose from 'mongoose';
import { WorkoutLog } from './WorkoutLog';

describe('WorkoutLog Model Unit Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await WorkoutLog.deleteMany({});
  });

  it('successfully creates a valid workout log and calculates total volume', async () => {
    const userId = new mongoose.Types.ObjectId();
    const exercise1Id = new mongoose.Types.ObjectId();
    const exercise2Id = new mongoose.Types.ObjectId();

    const log = new WorkoutLog({
      userId,
      name: 'Upper Body Power',
      durationMinutes: 45,
      startedAt: new Date(Date.now() - 45 * 60000),
      completedAt: new Date(),
      exercises: [
        {
          exerciseId: exercise1Id,
          exerciseName: 'Bench Press',
          sets: [
            { setNumber: 1, reps: 10, weight: 60, isWarmup: false }, // 600
            { setNumber: 2, reps: 8, weight: 70, isWarmup: false }, // 560
          ],
        },
        {
          exerciseId: exercise2Id,
          exerciseName: 'Bicep Curl',
          sets: [
            { setNumber: 1, reps: 12, weight: 15, isWarmup: false }, // 180
          ],
        },
      ],
    });

    const saved = await log.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('Upper Body Power');
    expect(saved.totalVolume).toBe(1340); // 600 + 560 + 180
  });

  it('fails validation if userId is missing', async () => {
    const log = new WorkoutLog({
      name: 'Home Workout',
      durationMinutes: 30,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    await expect(log.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('fails validation if durationMinutes is negative', async () => {
    const userId = new mongoose.Types.ObjectId();
    const log = new WorkoutLog({
      userId,
      name: 'Home Workout',
      durationMinutes: -5, // invalid
      startedAt: new Date(),
      completedAt: new Date(),
    });

    await expect(log.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
