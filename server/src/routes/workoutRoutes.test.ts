import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/User';
import Exercise from '../models/Exercise';
import WorkoutLog from '../models/WorkoutLog';
import WorkoutTemplate from '../models/WorkoutTemplate';
import { generateJWT } from '../utils/token';
import {
  UserRole,
  MuscleGroup,
  Equipment,
  DifficultyLevel,
} from 'gymfuel-shared';

describe('Workout Routes Integration Tests', () => {
  let testUserId: string;
  let authToken: string;
  let createdExerciseId: string;
  let createdTemplateId: string;

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
    await User.deleteMany({});
    await Exercise.deleteMany({});
    await WorkoutLog.deleteMany({});
    await WorkoutTemplate.deleteMany({});

    // Create test user and admin
    const user = await User.create({
      name: 'Regular Member',
      email: 'member@gymfuel.com',
      role: UserRole.USER,
      isOnboarded: true,
    });

    const admin = await User.create({
      name: 'Gym Admin',
      email: 'admin@gymfuel.com',
      role: UserRole.ADMIN,
      isOnboarded: true,
    });

    testUserId = user.id;
    authToken = generateJWT(user.id, user.role);

    // Create a dummy exercise
    const exercise = await Exercise.create({
      name: 'Barbell Bench Press',
      muscleGroup: MuscleGroup.CHEST,
      equipment: Equipment.BARBELL,
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions: ['Lie on bench', 'Unrack bar', 'Lower to chest', 'Push up'],
      isCustom: false,
    });
    createdExerciseId = exercise.id;

    // Create a dummy template
    const template = await WorkoutTemplate.create({
      name: 'Standard Push Routine',
      description: 'Chest, shoulders, triceps focus',
      difficulty: DifficultyLevel.INTERMEDIATE,
      durationWeeks: 4,
      daysPerWeek: 3,
      exercises: [
        {
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          sets: 4,
          repsRange: '8-12',
          restSeconds: 90,
        },
      ],
      targetMuscles: [
        MuscleGroup.CHEST,
        MuscleGroup.SHOULDERS,
        MuscleGroup.TRICEPS,
      ],
      createdByAdminId: admin._id,
      isPublished: true,
    });
    createdTemplateId = template.id;
  });

  describe('GET /api/workout/exercises', () => {
    it('returns 401 if request is not authenticated', async () => {
      const res = await request(app).get('/api/workout/exercises');
      expect(res.status).toBe(401);
    });

    it('returns list of exercises with pagination', async () => {
      const res = await request(app)
        .get('/api/workout/exercises')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.exercises).toBeDefined();
      expect(res.body.exercises).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.exercises[0].name).toBe('Barbell Bench Press');
    });

    it('filters exercises by muscle group and equipment', async () => {
      // Create another exercise with different group/equipment
      await Exercise.create({
        name: 'Dumbbell Bicep Curl',
        muscleGroup: MuscleGroup.BICEPS,
        equipment: Equipment.DUMBBELL,
        difficulty: DifficultyLevel.BEGINNER,
        instructions: ['Curl weights'],
      });

      const res = await request(app)
        .get('/api/workout/exercises?muscle=biceps&equipment=dumbbell')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.exercises).toHaveLength(1);
      expect(res.body.exercises[0].name).toBe('Dumbbell Bicep Curl');
    });
  });

  describe('GET /api/workout/exercises/:id', () => {
    it('returns single exercise details', async () => {
      const res = await request(app)
        .get(`/api/workout/exercises/${createdExerciseId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.exercise).toBeDefined();
      expect(res.body.exercise.name).toBe('Barbell Bench Press');
    });

    it('returns 404 if exercise does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/workout/exercises/${fakeId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid object ID', async () => {
      const res = await request(app)
        .get('/api/workout/exercises/invalid-id')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/workout/log', () => {
    it('successfully logs a workout session and computes volume', async () => {
      const payload = {
        name: 'Chest Day Workout',
        durationMinutes: 45,
        startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        completedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseId: createdExerciseId,
            exerciseName: 'Barbell Bench Press',
            sets: [
              { setNumber: 1, reps: 10, weight: 60, isWarmup: false, rpe: 8 },
              { setNumber: 2, reps: 8, weight: 70, isWarmup: false, rpe: 9 },
            ],
            notes: 'Felt strong',
          },
        ],
        notes: 'Great workout overall',
      };

      const res = await request(app)
        .post('/api/workout/log')
        .set('Cookie', [`token=${authToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.workoutLog).toBeDefined();
      expect(res.body.workoutLog.totalVolume).toBe(1160); // (10 * 60) + (8 * 70) = 600 + 560 = 1160
      expect(res.body.workoutLog.name).toBe('Chest Day Workout');

      // Verify db persistence
      const savedLogs = await WorkoutLog.find({ userId: testUserId });
      expect(savedLogs).toHaveLength(1);
      expect(savedLogs[0].totalVolume).toBe(1160);
    });

    it('fails if payload lacks required fields', async () => {
      const incompletePayload = {
        name: 'Chest Day',
        durationMinutes: -10, // Invalid duration
      };

      const res = await request(app)
        .post('/api/workout/log')
        .set('Cookie', [`token=${authToken}`])
        .send(incompletePayload);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/workout/history', () => {
    it('returns history of logged workouts for user sorted by startedAt desc', async () => {
      // Pre-seed two logs
      const pastDate = new Date(Date.now() - 24 * 3600000);
      const recentDate = new Date();

      await WorkoutLog.create([
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          name: 'Yesterday Session',
          durationMinutes: 30,
          totalVolume: 500,
          startedAt: pastDate,
          completedAt: pastDate,
          exercises: [],
        },
        {
          userId: new mongoose.Types.ObjectId(testUserId),
          name: 'Today Session',
          durationMinutes: 35,
          totalVolume: 800,
          startedAt: recentDate,
          completedAt: recentDate,
          exercises: [],
        },
      ]);

      const res = await request(app)
        .get('/api/workout/history')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(2);
      expect(res.body.history[0].name).toBe('Today Session'); // Sorted descending
      expect(res.body.history[1].name).toBe('Yesterday Session');
    });
  });

  describe('GET /api/workout/templates', () => {
    it('returns all published workout templates', async () => {
      const res = await request(app)
        .get('/api/workout/templates')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.templates).toHaveLength(1);
      expect(res.body.templates[0].name).toBe('Standard Push Routine');
    });
  });

  describe('GET /api/workout/templates/:id', () => {
    it('returns details of single template', async () => {
      const res = await request(app)
        .get(`/api/workout/templates/${createdTemplateId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.template).toBeDefined();
      expect(res.body.template.name).toBe('Standard Push Routine');
    });

    it('returns 404 if template does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/workout/templates/${fakeId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });
});
