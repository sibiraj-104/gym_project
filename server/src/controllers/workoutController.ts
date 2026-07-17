import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Exercise from '../models/Exercise';
import WorkoutLog from '../models/WorkoutLog';
import WorkoutTemplate from '../models/WorkoutTemplate';
import { Errors } from '../middleware/errorHandler';
import { logWorkoutSchema, MuscleGroup, Equipment } from 'gymfuel-shared';

/**
 * GET /api/workout/exercises
 * Paginated query to fetch exercise library with optional filters and search.
 */
export async function getExercises(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 20),
  );

  const muscle = req.query.muscle as string | undefined;
  const equipment = req.query.equipment as string | undefined;
  const search = req.query.search as string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (muscle && Object.values(MuscleGroup).includes(muscle as MuscleGroup)) {
    query.muscleGroup = muscle;
  }

  if (equipment && Object.values(Equipment).includes(equipment as Equipment)) {
    query.equipment = equipment;
  }

  if (search && search.trim().length > 0) {
    // Perform text search if name text index exists, or regex case-insensitive search
    query.$text = { $search: search };
  }

  const total = await Exercise.countDocuments(query);
  const exercises = await Exercise.find(query)
    .sort(search ? { score: { $meta: 'textScore' } } : { name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    exercises,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /api/workout/exercises/:id
 * Retrieve details for a single exercise.
 */
export async function getExerciseById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw Errors.badRequest('Invalid exercise ID format');
  }

  const exercise = await Exercise.findById(id);
  if (!exercise) {
    throw Errors.notFound('Exercise');
  }

  res.status(200).json({ exercise });
}

/**
 * POST /api/workout/log
 * Log a new completed workout session.
 */
export async function logWorkout(req: Request, res: Response): Promise<void> {
  if (!req.user?.userId) {
    throw Errors.unauthorized('Authentication required.');
  }

  const parsed = logWorkoutSchema.parse(req.body);

  const workoutLog = new WorkoutLog({
    userId: req.user.userId,
    ...parsed,
  });

  await workoutLog.save();

  res.status(201).json({
    message: 'Workout logged successfully',
    workoutLog,
  });
}

/**
 * GET /api/workout/history
 * Fetch paginated workout history logs for the current user.
 */
export async function getWorkoutHistory(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user?.userId) {
    throw Errors.unauthorized('Authentication required.');
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10),
  );

  const query = { userId: req.user.userId };

  const total = await WorkoutLog.countDocuments(query);
  const history = await WorkoutLog.find(query)
    .sort({ startedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    history,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /api/workout/templates
 * Retrieve available workout templates published by admins.
 */
export async function getWorkoutTemplates(
  _req: Request,
  res: Response,
): Promise<void> {
  const templates = await WorkoutTemplate.find({ isPublished: true }).sort({
    name: 1,
  });
  res.status(200).json({ templates });
}

/**
 * GET /api/workout/templates/:id
 * Retrieve details for a single workout template.
 */
export async function getWorkoutTemplateById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw Errors.badRequest('Invalid template ID format');
  }

  const template = await WorkoutTemplate.findById(id);
  if (!template) {
    throw Errors.notFound('WorkoutTemplate');
  }

  res.status(200).json({ template });
}
