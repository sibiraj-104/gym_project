import mongoose from 'mongoose';
import { Exercise } from './Exercise';
import { MuscleGroup, Equipment, DifficultyLevel } from 'gymfuel-shared';

describe('Exercise Model Unit Tests', () => {
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
    await Exercise.deleteMany({});
  });

  it('successfully creates a valid exercise with required fields', async () => {
    const validExercise = new Exercise({
      name: 'Barbell Squat',
      muscleGroup: MuscleGroup.QUADS,
      equipment: Equipment.BARBELL,
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions: [
        'Place bar on upper traps',
        'Squat down keeping knees inline with toes',
        'Drive through heels to stand',
      ],
    });

    const saved = await validExercise.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('Barbell Squat');
    expect(saved.isCustom).toBe(false); // default value
    expect(saved.secondaryMuscles?.length).toBe(0); // default value
  });

  it('fails validation if name is too short', async () => {
    const invalidExercise = new Exercise({
      name: 'a', // min length is 2
      muscleGroup: MuscleGroup.QUADS,
      equipment: Equipment.BARBELL,
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions: ['Squat'],
    });

    await expect(invalidExercise.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('fails validation if invalid muscle group is provided', async () => {
    const invalidExercise = new Exercise({
      name: 'Squat',
      muscleGroup: 'invalid_group', // not in MuscleGroup enum
      equipment: Equipment.BARBELL,
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions: ['Squat'],
    });

    await expect(invalidExercise.save()).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('supports text search index on name', async () => {
    const exercise = new Exercise({
      name: 'Dumbbell Hammer Curl',
      muscleGroup: MuscleGroup.BICEPS,
      equipment: Equipment.DUMBBELL,
      difficulty: DifficultyLevel.BEGINNER,
      instructions: ['Curl'],
    });
    await exercise.save();

    const results = await Exercise.find({
      $text: { $search: 'Hammer Curl' },
    });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Dumbbell Hammer Curl');
  });
});
