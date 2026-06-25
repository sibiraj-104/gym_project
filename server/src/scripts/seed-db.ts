// ============================================================
// GymFuel — Development Seed Script
// Run: pnpm --filter gymfuel-server run db:seed
//
// Populates the database with test data for local development.
// WARNING: This will CLEAR existing seed data before inserting.
// Do NOT run in production.
// ============================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymfuel';

async function seed(): Promise<void> {
  console.log('\n🌱 GymFuel — Development Seed Script');
  console.log('━'.repeat(50));

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed script cannot run in production!');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;
  console.log('✅ Connected to MongoDB:', mongoose.connection.host, '\n');

  // ── Clear existing seed data ─────────────────────────────
  console.log('🗑️  Clearing existing seed data...');
  await db.collection('users').deleteMany({ _seedData: true });
  await db.collection('exercises').deleteMany({ _seedData: true });
  await db.collection('food_items').deleteMany({ _seedData: true });
  await db.collection('feature_flags').deleteMany({});
  console.log('   Done.\n');

  // ── Seed: Users ────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);

  await db.collection('users').insertMany([
    {
      name: 'Super Admin',
      email: 'admin@gymfuel.dev',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isOnboarded: true,
      streakCount: 0,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _seedData: true,
    },
    {
      name: 'Test User',
      email: 'user@gymfuel.dev',
      passwordHash: userPasswordHash,
      role: 'user',
      isOnboarded: true,
      profile: {
        age: 28,
        weight: 75,
        height: 178,
        gender: 'male',
        activityLevel: 'moderate',
      },
      goals: {
        type: 'build_muscle',
        targetCalories: 2800,
        targetProtein: 180,
        targetCarbs: 320,
        targetFat: 80,
        targetWaterGlasses: 10,
      },
      streakCount: 3,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _seedData: true,
    },
  ]);
  console.log(
    '   ✓ 2 users: admin@gymfuel.dev (Admin@123), user@gymfuel.dev (User@123)',
  );

  // ── Seed: Exercises ────────────────────────────────────────
  console.log('\n💪 Seeding exercises (50 exercises)...');

  const exercises = [
    // Chest
    {
      name: 'Barbell Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['triceps', 'shoulders'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Lie flat on bench',
        'Grip bar slightly wider than shoulder width',
        'Lower to chest',
        'Press up explosively',
      ],
    },
    {
      name: 'Dumbbell Flye',
      muscleGroup: 'chest',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Lie on bench with dumbbells',
        'Arms extended above chest',
        'Lower arms in wide arc',
        'Return to start',
      ],
    },
    {
      name: 'Incline Dumbbell Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'triceps'],
      equipment: 'dumbbell',
      difficulty: 'intermediate',
      instructions: [
        'Set bench to 30-45°',
        'Press dumbbells above upper chest',
        'Lower slowly',
      ],
    },
    {
      name: 'Cable Crossover',
      muscleGroup: 'chest',
      equipment: 'cable',
      difficulty: 'intermediate',
      instructions: [
        'Stand between cables set high',
        'Pull handles together in front',
        'Squeeze chest at peak',
      ],
    },
    {
      name: 'Push-Up',
      muscleGroup: 'chest',
      secondaryMuscles: ['triceps', 'core'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: [
        'Hands shoulder-width apart',
        'Keep body straight',
        'Lower to ground',
        'Push back up',
      ],
    },
    // Back
    {
      name: 'Barbell Deadlift',
      muscleGroup: 'back',
      secondaryMuscles: ['hamstrings', 'glutes', 'core'],
      equipment: 'barbell',
      difficulty: 'advanced',
      instructions: [
        'Stand with bar over feet',
        'Hip-hinge down, grip bar',
        'Drive hips forward to stand',
        'Lower with control',
      ],
    },
    {
      name: 'Pull-Up',
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      equipment: 'pull_up_bar',
      difficulty: 'intermediate',
      instructions: [
        'Hang from bar with overhand grip',
        'Pull chest to bar',
        'Lower with control',
      ],
    },
    {
      name: 'Seated Cable Row',
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      equipment: 'cable',
      difficulty: 'beginner',
      instructions: [
        'Sit at cable machine',
        'Pull handle to abdomen',
        'Squeeze back',
        'Return slowly',
      ],
    },
    {
      name: 'Lat Pulldown',
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Grip bar wide',
        'Pull down to upper chest',
        'Squeeze lats',
        'Control the return',
      ],
    },
    {
      name: 'Dumbbell Row',
      muscleGroup: 'back',
      secondaryMuscles: ['biceps'],
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Plant one knee on bench',
        'Row dumbbell to hip',
        'Squeeze at top',
      ],
    },
    // Shoulders
    {
      name: 'Overhead Press',
      muscleGroup: 'shoulders',
      secondaryMuscles: ['triceps'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Stand with bar at shoulders',
        'Press straight overhead',
        'Lock out arms',
        'Lower with control',
      ],
    },
    {
      name: 'Lateral Raise',
      muscleGroup: 'shoulders',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Hold dumbbells at sides',
        'Raise arms to shoulder height',
        'Lower slowly',
      ],
    },
    {
      name: 'Front Raise',
      muscleGroup: 'shoulders',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Hold dumbbells in front',
        'Raise to shoulder height',
        'Lower slowly',
      ],
    },
    {
      name: 'Face Pull',
      muscleGroup: 'shoulders',
      secondaryMuscles: ['back'],
      equipment: 'cable',
      difficulty: 'beginner',
      instructions: [
        'Set cable at face height',
        'Pull rope to face, elbows high',
        'Squeeze rear delts',
      ],
    },
    {
      name: 'Arnold Press',
      muscleGroup: 'shoulders',
      secondaryMuscles: ['triceps'],
      equipment: 'dumbbell',
      difficulty: 'intermediate',
      instructions: [
        'Start with palms facing you',
        'Rotate and press overhead',
        'Reverse on way down',
      ],
    },
    // Biceps
    {
      name: 'Barbell Curl',
      muscleGroup: 'biceps',
      equipment: 'barbell',
      difficulty: 'beginner',
      instructions: [
        'Stand with underhand grip',
        'Curl bar to shoulders',
        'Squeeze at top',
        'Lower slowly',
      ],
    },
    {
      name: 'Hammer Curl',
      muscleGroup: 'biceps',
      secondaryMuscles: ['forearms'],
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Neutral grip (thumbs up)',
        'Curl to shoulders',
        'Lower slowly',
      ],
    },
    {
      name: 'Incline Dumbbell Curl',
      muscleGroup: 'biceps',
      equipment: 'dumbbell',
      difficulty: 'intermediate',
      instructions: [
        'Sit on inclined bench',
        'Arms hang fully extended',
        'Curl to shoulders',
      ],
    },
    {
      name: 'Concentration Curl',
      muscleGroup: 'biceps',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Sit, elbow on inner thigh',
        'Curl dumbbell up',
        'Squeeze at peak',
      ],
    },
    {
      name: 'Cable Curl',
      muscleGroup: 'biceps',
      equipment: 'cable',
      difficulty: 'beginner',
      instructions: ['Face cable machine', 'Curl handle up', 'Squeeze at top'],
    },
    // Triceps
    {
      name: 'Tricep Dip',
      muscleGroup: 'triceps',
      secondaryMuscles: ['chest', 'shoulders'],
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      instructions: [
        'Grip parallel bars',
        'Lower body by bending elbows',
        'Push back to start',
      ],
    },
    {
      name: 'Skull Crusher',
      muscleGroup: 'triceps',
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Lie on bench, bar above chest',
        'Lower bar to forehead by bending elbows',
        'Extend back up',
      ],
    },
    {
      name: 'Tricep Pushdown',
      muscleGroup: 'triceps',
      equipment: 'cable',
      difficulty: 'beginner',
      instructions: [
        'Face cable machine',
        'Push handle down until arms straight',
        'Control the return',
      ],
    },
    {
      name: 'Overhead Tricep Extension',
      muscleGroup: 'triceps',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: [
        'Hold dumbbell overhead',
        'Lower behind head',
        'Extend back up',
      ],
    },
    {
      name: 'Close-Grip Bench Press',
      muscleGroup: 'triceps',
      secondaryMuscles: ['chest'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Narrow grip on bar',
        'Lower to chest',
        'Press up, keeping elbows in',
      ],
    },
    // Legs — Quads
    {
      name: 'Barbell Squat',
      muscleGroup: 'quads',
      secondaryMuscles: ['hamstrings', 'glutes'],
      equipment: 'barbell',
      difficulty: 'advanced',
      instructions: [
        'Bar on upper back',
        'Squat to parallel',
        'Drive through heels to stand',
      ],
    },
    {
      name: 'Leg Press',
      muscleGroup: 'quads',
      secondaryMuscles: ['hamstrings', 'glutes'],
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Set appropriate weight',
        'Press platform up',
        'Lower with control',
      ],
    },
    {
      name: 'Leg Extension',
      muscleGroup: 'quads',
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Sit in machine',
        'Extend legs fully',
        'Lower with control',
      ],
    },
    {
      name: 'Bulgarian Split Squat',
      muscleGroup: 'quads',
      secondaryMuscles: ['glutes'],
      equipment: 'dumbbell',
      difficulty: 'intermediate',
      instructions: [
        'Rear foot elevated on bench',
        'Lower front knee to ground',
        'Drive through front heel',
      ],
    },
    {
      name: 'Hack Squat',
      muscleGroup: 'quads',
      secondaryMuscles: ['hamstrings'],
      equipment: 'machine',
      difficulty: 'intermediate',
      instructions: [
        'Position on hack squat machine',
        'Lower to 90°',
        'Drive up',
      ],
    },
    // Legs — Hamstrings
    {
      name: 'Romanian Deadlift',
      muscleGroup: 'hamstrings',
      secondaryMuscles: ['glutes', 'back'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Hip-hinge forward',
        'Bar slides down legs',
        'Feel hamstring stretch',
        'Return to standing',
      ],
    },
    {
      name: 'Lying Leg Curl',
      muscleGroup: 'hamstrings',
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Lie face down in machine',
        'Curl heels to glutes',
        'Lower with control',
      ],
    },
    {
      name: 'Nordic Curl',
      muscleGroup: 'hamstrings',
      equipment: 'bodyweight',
      difficulty: 'advanced',
      instructions: [
        'Kneel with feet anchored',
        'Slowly lower body forward',
        'Use hands to catch yourself',
        'Pull back with hamstrings',
      ],
    },
    // Glutes
    {
      name: 'Hip Thrust',
      muscleGroup: 'glutes',
      secondaryMuscles: ['hamstrings'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: [
        'Shoulders on bench, bar on hips',
        'Drive hips to ceiling',
        'Squeeze glutes at top',
      ],
    },
    {
      name: 'Glute Bridge',
      muscleGroup: 'glutes',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: [
        'Lie on back, feet flat',
        'Drive hips up',
        'Squeeze glutes at top',
      ],
    },
    // Core
    {
      name: 'Plank',
      muscleGroup: 'core',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: [
        'Forearms on ground',
        'Body straight from head to heels',
        'Hold position',
      ],
    },
    {
      name: 'Cable Crunch',
      muscleGroup: 'core',
      equipment: 'cable',
      difficulty: 'beginner',
      instructions: [
        'Kneel at cable machine',
        'Pull rope to floor, crunching abs',
        'Return slowly',
      ],
    },
    {
      name: 'Ab Wheel Rollout',
      muscleGroup: 'core',
      equipment: 'none',
      difficulty: 'advanced',
      instructions: [
        'Start kneeling',
        'Roll wheel forward',
        'Return using core strength',
      ],
    },
    {
      name: 'Hanging Leg Raise',
      muscleGroup: 'core',
      equipment: 'pull_up_bar',
      difficulty: 'intermediate',
      instructions: [
        'Hang from bar',
        'Raise legs to 90° or higher',
        'Lower with control',
      ],
    },
    // Calves
    {
      name: 'Standing Calf Raise',
      muscleGroup: 'calves',
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Stand with toes on edge',
        'Rise onto tiptoes',
        'Lower past neutral for stretch',
      ],
    },
    {
      name: 'Seated Calf Raise',
      muscleGroup: 'calves',
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: [
        'Sit in machine',
        'Push through toes to rise',
        'Lower with control',
      ],
    },
    // Cardio
    {
      name: 'Treadmill Run',
      muscleGroup: 'cardio',
      equipment: 'machine',
      difficulty: 'beginner',
      instructions: ['Set speed and incline', 'Run at steady pace'],
    },
    {
      name: 'Jump Rope',
      muscleGroup: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      instructions: [
        'Hold rope handles',
        'Jump with both feet',
        'Maintain rhythm',
      ],
    },
    {
      name: 'Battle Ropes',
      muscleGroup: 'cardio',
      secondaryMuscles: ['shoulders', 'core'],
      equipment: 'none',
      difficulty: 'intermediate',
      instructions: [
        'Hold rope ends',
        'Create waves alternately or simultaneously',
        'Keep core tight',
      ],
    },
    {
      name: 'Box Jump',
      muscleGroup: 'cardio',
      secondaryMuscles: ['quads', 'glutes'],
      equipment: 'none',
      difficulty: 'intermediate',
      instructions: [
        'Stand in front of box',
        'Jump onto box landing softly',
        'Step back down',
      ],
    },
    // Forearms
    {
      name: 'Wrist Curl',
      muscleGroup: 'forearms',
      equipment: 'barbell',
      difficulty: 'beginner',
      instructions: [
        'Sit with forearms on thighs',
        'Curl wrists up with barbell',
        'Lower fully',
      ],
    },
    {
      name: 'Reverse Wrist Curl',
      muscleGroup: 'forearms',
      equipment: 'barbell',
      difficulty: 'beginner',
      instructions: ['Overhand grip', 'Extend wrists up', 'Lower slowly'],
    },
    // Full Body
    {
      name: 'Burpee',
      muscleGroup: 'full_body',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      instructions: [
        'Drop to plank',
        'Do a push-up',
        'Jump feet to hands',
        'Jump up with arms overhead',
      ],
    },
    {
      name: 'Kettlebell Swing',
      muscleGroup: 'full_body',
      secondaryMuscles: ['hamstrings', 'glutes', 'core'],
      equipment: 'kettlebell',
      difficulty: 'intermediate',
      instructions: [
        'Hip hinge with kettlebell between legs',
        'Drive hips forward explosively',
        'Let bell swing to shoulder height',
        'Hinge back down',
      ],
    },
    {
      name: 'Thruster',
      muscleGroup: 'full_body',
      secondaryMuscles: ['shoulders', 'quads'],
      equipment: 'barbell',
      difficulty: 'advanced',
      instructions: [
        'Front squat to parallel',
        'Drive up explosively',
        'Press bar overhead in one motion',
      ],
    },
  ];

  await db.collection('exercises').insertMany(
    exercises.map((ex) => ({
      ...ex,
      secondaryMuscles: ex.secondaryMuscles || [],
      isCustom: false,
      _seedData: true,
      createdAt: new Date().toISOString(),
    })),
  );
  console.log(`   ✓ ${exercises.length} exercises across all muscle groups`);

  // ── Seed: Food Items ───────────────────────────────────────
  console.log('\n🍎 Seeding food items (20 common foods)...');

  const foods = [
    {
      name: 'Chicken Breast (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Brown Rice (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: {
        calories: 112,
        protein: 2.6,
        carbs: 24,
        fat: 0.9,
        fiber: 1.8,
      },
      source: 'adminAdded',
    },
    {
      name: 'Whole Egg',
      brand: null,
      servingSize: 50,
      servingUnit: 'g',
      nutrition: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Oats (raw)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
      source: 'adminAdded',
    },
    {
      name: 'Banana',
      brand: null,
      servingSize: 120,
      servingUnit: 'g',
      nutrition: {
        calories: 107,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 3.1,
      },
      source: 'adminAdded',
    },
    {
      name: 'Salmon (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Greek Yogurt (plain, 0%)',
      brand: 'Generic',
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Broccoli (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: {
        calories: 35,
        protein: 2.4,
        carbs: 7.2,
        fat: 0.4,
        fiber: 3.3,
      },
      source: 'adminAdded',
    },
    {
      name: 'Almonds',
      brand: null,
      servingSize: 28,
      servingUnit: 'g',
      nutrition: { calories: 164, protein: 6, carbs: 6.1, fat: 14, fiber: 3.5 },
      source: 'adminAdded',
    },
    {
      name: 'Sweet Potato (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3 },
      source: 'adminAdded',
    },
    {
      name: 'Milk (full fat)',
      brand: null,
      servingSize: 240,
      servingUnit: 'ml',
      nutrition: { calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Cottage Cheese (low fat)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Tuna (canned in water)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Peanut Butter',
      brand: null,
      servingSize: 32,
      servingUnit: 'g',
      nutrition: { calories: 188, protein: 8, carbs: 6.9, fat: 16, fiber: 1.9 },
      source: 'adminAdded',
    },
    {
      name: 'White Rice (cooked)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: {
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        fiber: 0.4,
      },
      source: 'adminAdded',
    },
    {
      name: 'Spinach (raw)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: {
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        fiber: 2.2,
      },
      source: 'adminAdded',
    },
    {
      name: 'Whey Protein Powder',
      brand: 'Generic',
      servingSize: 30,
      servingUnit: 'g',
      nutrition: { calories: 120, protein: 24, carbs: 3, fat: 2, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Apple',
      brand: null,
      servingSize: 182,
      servingUnit: 'g',
      nutrition: {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.4,
      },
      source: 'adminAdded',
    },
    {
      name: 'Paneer (fresh)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0 },
      source: 'adminAdded',
    },
    {
      name: 'Dal (cooked, mixed)',
      brand: null,
      servingSize: 100,
      servingUnit: 'g',
      nutrition: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
      source: 'adminAdded',
    },
  ];

  await db.collection('food_items').insertMany(
    foods.map((food) => ({
      ...food,
      isApproved: true,
      reportCount: 0,
      _seedData: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  );
  console.log(`   ✓ ${foods.length} food items (common foods + Indian foods)`);

  // ── Seed: Feature Flags ────────────────────────────────────
  console.log('\n🚩 Seeding feature flags...');

  await db.collection('feature_flags').insertMany([
    {
      key: 'ai_coach_enabled',
      value: true,
      description: 'Enable AI Coach chatbot',
      updatedAt: new Date(),
    },
    {
      key: 'ai_food_scan_enabled',
      value: true,
      description: 'Enable AI photo food scanning',
      updatedAt: new Date(),
    },
    {
      key: 'ai_diet_plan_enabled',
      value: true,
      description: 'Enable AI diet plan generation',
      updatedAt: new Date(),
    },
    {
      key: 'ai_workout_plan_enabled',
      value: true,
      description: 'Enable AI workout plan generation',
      updatedAt: new Date(),
    },
    {
      key: 'push_notifications_enabled',
      value: false,
      description:
        'Enable PWA push notifications (disabled until VAPID configured)',
      updatedAt: new Date(),
    },
    {
      key: 'barcode_scanner_enabled',
      value: true,
      description: 'Enable barcode food scanner',
      updatedAt: new Date(),
    },
    {
      key: 'maintenance_mode',
      value: false,
      description: 'Put entire app in maintenance mode',
      updatedAt: new Date(),
    },
  ]);
  console.log(
    '   ✓ 7 feature flags (ai_coach, ai_scan, diet_plan, workout_plan, push, barcode, maintenance)',
  );

  console.log('\n' + '━'.repeat(50));
  console.log('✅ Seed complete!\n');
  console.log('📧 Test credentials:');
  console.log('   Admin: admin@gymfuel.dev / Admin@123');
  console.log('   User:  user@gymfuel.dev  / User@123\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  });
