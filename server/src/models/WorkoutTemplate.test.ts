import mongoose from 'mongoose';
import { WorkoutTemplate } from './WorkoutTemplate';
import { MuscleGroup, DifficultyLevel } from 'gymfuel-shared';

describe('WorkoutTemplate Model Unit Tests', () => {
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
    await WorkoutTemplate.deleteMany({});
  });

  it('successfully creates a valid workout template with required fields', async () => {
    const createdByAdminId = new mongoose.Types.ObjectId();
    const exerciseId = new mongoose.Types.ObjectId();

    const template = new WorkoutTemplate({
      name: 'PPL — Push Day A',
      description: 'Focus on chest, shoulders, and triceps press movements.',
      difficulty: DifficultyLevel.INTERMEDIATE,
      durationWeeks: 4,
      daysPerWeek: 3,
      createdByAdminId,
      targetMuscles: [
        MuscleGroup.CHEST,
        MuscleGroup.SHOULDERS,
        MuscleGroup.TRICEPS,
      ],
      exercises: [
        {
          exerciseId,
          exerciseName: 'Dumbbell Incline Press',
          sets: 4,
          repsRange: '8-12',
          restSeconds: 90,
        },
      ],
    });

    const saved = await template.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('PPL — Push Day A');
    expect(saved.isPublished).toBe(true); // default value
    expect(saved.exercises.length).toBe(1);
    expect(saved.exercises[0].exerciseName).toBe('Dumbbell Incline Press');
  });

  it('fails validation if createdByAdminId is missing', async () => {
    const template = new WorkoutTemplate({
      name: 'Push Day A',
      difficulty: DifficultyLevel.INTERMEDIATE,
    });

    await expect(template.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('fails validation if invalid difficulty level is provided', async () => {
    const createdByAdminId = new mongoose.Types.ObjectId();
    const template = new WorkoutTemplate({
      name: 'Push Day A',
      difficulty: 'expert', // invalid
      createdByAdminId,
    });

    await expect(template.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });
});
