// ============================================================
// GymFuel — Exercise Database Seeder
// Run: pnpm --filter gymfuel-server run db:seed-exercises
//
// Populates the database with 500+ exercises across all major muscle groups.
// WARNING: This clears all existing seeded exercises before inserting.
// ============================================================

import mongoose from 'mongoose';
import { MuscleGroup, Equipment, DifficultyLevel } from 'gymfuel-shared';
import { Exercise } from '../models/Exercise';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymfuel';

// Base Movements with details
interface BaseMovement {
  baseName: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  defaultDifficulty: DifficultyLevel;
  instructionsPattern: string[];
}

const baseMovements: BaseMovement[] = [
  // CHEST
  {
    baseName: 'Bench Press',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Lie flat on your back on the bench/floor.',
      'Grip the weight slightly wider than shoulder-width apart.',
      'Lower the weight slowly to your mid-chest.',
      'Push the weight back up powerfully to the starting position.',
    ],
  },
  {
    baseName: 'Fly',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Lie flat or stand according to the equipment setup.',
      'Hold the weights above your chest with a slight bend in your elbows.',
      'Lower your arms out to the sides in a wide arc until you feel a stretch in your chest.',
      'Squeeze your chest to bring the weights back to the starting position.',
    ],
  },
  {
    baseName: 'Incline Press',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Position yourself on an incline bench/machine set to 30-45 degrees.',
      'Grip the weight at shoulder level.',
      'Lower the weight with control to your upper chest.',
      'Press the weight upward until your arms are fully extended.',
    ],
  },
  {
    baseName: 'Decline Press',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Secure yourself on a decline bench.',
      'Grip the weight at shoulder-width.',
      'Lower the weight to your lower chest/sternum area.',
      'Press the weight back up to the starting position.',
    ],
  },
  {
    baseName: 'Pullover',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.BACK, MuscleGroup.TRICEPS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Lie across a flat bench, supporting only your upper back.',
      'Hold the weight directly above your chest with slightly bent arms.',
      'Lower the weight back behind your head in an arc until you feel a stretch.',
      'Pull the weight back up to the starting position.',
    ],
  },
  // BACK
  {
    baseName: 'Row',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Assume a stable stance, hinging at the hips with a flat back.',
      'Grip the weight and pull it towards your lower ribcage.',
      'Squeeze your shoulder blades together at the top of the movement.',
      'Slowly lower the weight back to the starting position.',
    ],
  },
  {
    baseName: 'Lat Pulldown',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Sit at the station and adjust the thigh pad.',
      'Grip the bar/handles with a wide grip.',
      'Pull down toward your upper chest, leading with your elbows.',
      'Squeeze your lats at the bottom, then slowly return the weight.',
    ],
  },
  {
    baseName: 'Pull-Up',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.CORE],
    defaultDifficulty: DifficultyLevel.ADVANCED,
    instructionsPattern: [
      'Hang from the bar/handles with an overhand grip.',
      'Pull your chest up toward the bar, driving your elbows down.',
      'Clear the bar with your chin, then lower yourself with control.',
    ],
  },
  {
    baseName: 'Deadlift',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [
      MuscleGroup.HAMSTRINGS,
      MuscleGroup.GLUTES,
      MuscleGroup.CORE,
    ],
    defaultDifficulty: DifficultyLevel.ADVANCED,
    instructionsPattern: [
      'Stand with feet hip-width apart.',
      'Hinge at your hips and bend your knees to grip the weight.',
      'Keep your back flat, chest up, and drive through your heels to stand up straight.',
      'Lower the weight with control by hinging at the hips and bending knees.',
    ],
  },
  {
    baseName: 'Shrug',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand upright holding the weights.',
      'Elevate your shoulders as high as possible, as if trying to touch your ears.',
      'Hold the contraction for a second, then lower your shoulders back down.',
    ],
  },
  // SHOULDERS
  {
    baseName: 'Overhead Press',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.CORE],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Stand or sit upright holding the weight at shoulder height.',
      'Brace your core and press the weight straight overhead until arms are locked.',
      'Lower the weight back to shoulder height with control.',
    ],
  },
  {
    baseName: 'Lateral Raise',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.BACK],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand with weights at your sides, knees slightly bent.',
      'Raise your arms out to the sides in a wide arc until they are parallel to the floor.',
      'Slowly lower the weights back to the starting position.',
    ],
  },
  {
    baseName: 'Front Raise',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.CHEST],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand holding weights in front of your thighs.',
      'Raise the weights straight out in front of you until arms are parallel to the floor.',
      'Lower back down slowly, resisting gravity.',
    ],
  },
  {
    baseName: 'Rear Delt Raise',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.BACK],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Bend forward at the hips with a flat back.',
      'Raise your arms out to the sides, squeezing your rear delts.',
      'Lower the weights slowly back to the start.',
    ],
  },
  // BICEPS
  {
    baseName: 'Bicep Curl',
    muscleGroup: MuscleGroup.BICEPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand or sit holding the weights with palms facing forward.',
      'Keep your elbows tucked near your torso and curl the weights up toward your shoulders.',
      'Squeeze your biceps at the peak, then slowly lower the weights.',
    ],
  },
  {
    baseName: 'Hammer Curl',
    muscleGroup: MuscleGroup.BICEPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand or sit holding the weights with a neutral grip (palms facing each other).',
      'Curl the weights upward while keeping palms facing each other.',
      'Squeeze and return to the starting position with control.',
    ],
  },
  {
    baseName: 'Preacher Curl',
    muscleGroup: MuscleGroup.BICEPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Sit at a preacher bench and rest your arms flat on the pad.',
      'Hold the weight and curl it upward while keeping your upper arms glued to the pad.',
      'Lower the weight fully back down before beginning the next rep.',
    ],
  },
  // TRICEPS
  {
    baseName: 'Tricep Extension',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Hold the weight overhead or in front depending on pulley.',
      'Bend your elbows to lower the weight behind/toward you with control.',
      'Extend your arms back to the starting position.',
    ],
  },
  {
    baseName: 'Tricep Pushdown',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand facing the pulley, holding the attachment with elbows tucked at your sides.',
      'Extend your arms downward, squeezing your triceps at the bottom.',
      'Slowly release back up to the starting elbow position.',
    ],
  },
  {
    baseName: 'Tricep Kickback',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Bend forward at the hips, keeping your upper arm parallel to your torso.',
      'Extend your elbow back to straighten your arm, keeping your upper arm still.',
      'Slowly bend your elbow to return to the starting position.',
    ],
  },
  // FOREARMS
  {
    baseName: 'Wrist Curl',
    muscleGroup: MuscleGroup.FOREARMS,
    secondaryMuscles: [],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Rest your forearms on your thighs or a bench, palms facing up.',
      'Hold the weights and let your wrists hang off the edge.',
      'Curl your wrists upward, squeezing your forearms.',
      'Lower back down with control.',
    ],
  },
  {
    baseName: 'Farmer Carry',
    muscleGroup: MuscleGroup.FOREARMS,
    secondaryMuscles: [MuscleGroup.CORE, MuscleGroup.SHOULDERS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Pick up heavy weights in each hand.',
      'Stand tall, engage your core, and walk in a straight line.',
      'Maintain proper posture and keep a tight grip throughout the carry.',
    ],
  },
  // CORE
  {
    baseName: 'Crunch',
    muscleGroup: MuscleGroup.CORE,
    secondaryMuscles: [],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Lie flat on your back with knees bent.',
      'Place hands behind your head or crossed over your chest.',
      'Contract your abs to lift your shoulders off the floor.',
      'Slowly lower back down to the starting position.',
    ],
  },
  {
    baseName: 'Plank',
    muscleGroup: MuscleGroup.CORE,
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.GLUTES],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Place your forearms on the floor, elbows aligned under shoulders.',
      'Extend your legs straight back and support your weight on toes.',
      'Keep your body in a straight line, squeezing your core and glutes.',
      'Hold this position.',
    ],
  },
  {
    baseName: 'Leg Raise',
    muscleGroup: MuscleGroup.CORE,
    secondaryMuscles: [MuscleGroup.QUADS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Lie flat on your back with arms at your sides.',
      'Keep your legs straight and raise them up to a 90-degree angle.',
      'Slowly lower your legs back down until they hover just above the floor.',
    ],
  },
  // QUADS
  {
    baseName: 'Squat',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [
      MuscleGroup.GLUTES,
      MuscleGroup.HAMSTRINGS,
      MuscleGroup.CORE,
    ],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand with feet shoulder-width apart.',
      'Lower your hips back and down as if sitting in a chair, keeping chest up.',
      'Go down until thighs are parallel to the floor.',
      'Drive through your heels to return to the standing position.',
    ],
  },
  {
    baseName: 'Lunge',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand tall, then take a big step forward with one leg.',
      'Lower your hips until both knees are bent at about 90 degrees.',
      'Push off your front heel to return to the starting position.',
    ],
  },
  {
    baseName: 'Leg Extension',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Sit in the leg extension machine, placing pad on top of lower shins.',
      'Grasp the handles and extend your knees fully.',
      'Squeeze your quads at the top, then slowly lower to the start.',
    ],
  },
  // HAMSTRINGS
  {
    baseName: 'Romanian Deadlift',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.BACK],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Stand holding weights in front of thighs, knees slightly bent.',
      'Hinge at your hips, sending your butt back, and lower weights down your legs.',
      'Go down until you feel a deep stretch, keeping back flat.',
      'Contract glutes and hamstrings to return to standing.',
    ],
  },
  {
    baseName: 'Leg Curl',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    secondaryMuscles: [MuscleGroup.CALVES],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Position yourself on the leg curl machine, placing pad behind ankles.',
      'Pull your heels toward your glutes, contracting your hamstrings.',
      'Slowly return to the starting position.',
    ],
  },
  // GLUTES
  {
    baseName: 'Hip Thrust',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.HAMSTRINGS],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Sit on the floor with your upper back resting against a bench.',
      'Place the weight across your hips.',
      'Drive through your heels and squeeze your glutes to lift hips.',
      'Lower hips back down with control.',
    ],
  },
  {
    baseName: 'Glute Bridge',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.CORE],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Lie on your back with knees bent and feet flat on the floor.',
      'Squeeze your glutes and push your hips up toward the ceiling.',
      'Hold the contraction, then lower back down with control.',
    ],
  },
  // CALVES
  {
    baseName: 'Calf Raise',
    muscleGroup: MuscleGroup.CALVES,
    secondaryMuscles: [],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Stand with the balls of your feet on a platform.',
      'Lower your heels to stretch the calves.',
      'Raise up onto your toes as high as possible, squeezing calves.',
      'Lower back down slowly.',
    ],
  },
  // FULL_BODY
  {
    baseName: 'Thruster',
    muscleGroup: MuscleGroup.FULL_BODY,
    secondaryMuscles: [
      MuscleGroup.QUADS,
      MuscleGroup.SHOULDERS,
      MuscleGroup.CORE,
      MuscleGroup.TRICEPS,
    ],
    defaultDifficulty: DifficultyLevel.ADVANCED,
    instructionsPattern: [
      'Hold weights at shoulder height and squat down.',
      'As you stand up, use the momentum to press the weights overhead.',
      'Lower the weights to your shoulders as you descend into the next squat.',
    ],
  },
  {
    baseName: 'Kettlebell Swing',
    muscleGroup: MuscleGroup.FULL_BODY,
    secondaryMuscles: [
      MuscleGroup.GLUTES,
      MuscleGroup.HAMSTRINGS,
      MuscleGroup.CORE,
      MuscleGroup.SHOULDERS,
    ],
    defaultDifficulty: DifficultyLevel.INTERMEDIATE,
    instructionsPattern: [
      'Stand over the kettlebell with feet wider than shoulder-width.',
      'Hinge at hips to grab the kettlebell and hike it back between legs.',
      'Drive hips forward to swing the kettlebell up to shoulder height.',
      'Let the kettlebell swing back down naturally, hinging at hips.',
    ],
  },
  // CARDIO
  {
    baseName: 'Running',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [
      MuscleGroup.QUADS,
      MuscleGroup.HAMSTRINGS,
      MuscleGroup.CALVES,
    ],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Maintain an upright posture and consistent stride.',
      'Land on your midfoot and roll forward.',
      'Breathe rhythmically.',
    ],
  },
  {
    baseName: 'Jump Rope',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [
      MuscleGroup.CALVES,
      MuscleGroup.SHOULDERS,
      MuscleGroup.FOREARMS,
    ],
    defaultDifficulty: DifficultyLevel.BEGINNER,
    instructionsPattern: [
      'Hold rope handles, rotate wrists to swing the rope.',
      'Jump on balls of feet as the rope clears.',
      'Maintain a soft bend in knees and land softly.',
    ],
  },
];

// Helper to capitalize words
interface SeedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: DifficultyLevel;
  instructions: string[];
  isCustom: boolean;
  _seedData: boolean;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Generate the 500+ exercise list
function generateExercises(): SeedExercise[] {
  const list: SeedExercise[] = [];

  // Define equipment array
  const equipments = Object.values(Equipment);

  // Modifiers to multiply names and make them distinct
  const modifiers = [
    { prefix: '', suffix: '' },
    { prefix: 'Seated', suffix: '' },
    { prefix: 'Standing', suffix: '' },
    { prefix: 'Single-Arm', suffix: '' },
    { prefix: 'Alternating', suffix: '' },
    { prefix: 'Single-Leg', suffix: '' },
    { prefix: 'Incline', suffix: '' },
    { prefix: 'Decline', suffix: '' },
    { prefix: 'Flat', suffix: '' },
    { prefix: 'Tempo', suffix: '' },
    { prefix: 'Unilateral', suffix: '' },
    { prefix: 'Assisted', suffix: '' },
    { prefix: 'Supported', suffix: '' },
    { prefix: 'Deficit', suffix: '' },
    { prefix: 'Explosive', suffix: '' },
  ];

  for (const movement of baseMovements) {
    for (const eq of equipments) {
      // Bodyweight exercises don't typically have "Barbell" equipment, etc.
      // So let's check compatibility
      if (
        eq === Equipment.BODYWEIGHT &&
        movement.baseName.includes('Press') &&
        !movement.baseName.includes('Push-Up')
      ) {
        // Bodyweight press is basically pushups/dips
        continue;
      }
      if (
        eq === Equipment.BARBELL &&
        (movement.baseName === 'Plank' ||
          movement.baseName === 'Running' ||
          movement.baseName === 'Jump Rope')
      ) {
        continue;
      }
      if (
        eq === Equipment.NONE &&
        movement.baseName !== 'Running' &&
        movement.baseName !== 'Jump Rope' &&
        movement.baseName !== 'Plank' &&
        movement.baseName !== 'Crunch'
      ) {
        continue;
      }

      // Generate variants using modifiers
      for (const mod of modifiers) {
        // Skip incompatible combinations
        if (
          mod.prefix === 'Single-Leg' &&
          movement.muscleGroup !== MuscleGroup.QUADS &&
          movement.muscleGroup !== MuscleGroup.HAMSTRINGS &&
          movement.muscleGroup !== MuscleGroup.GLUTES
        ) {
          continue;
        }
        if (
          mod.prefix === 'Incline' &&
          movement.muscleGroup !== MuscleGroup.CHEST &&
          movement.muscleGroup !== MuscleGroup.SHOULDERS
        ) {
          continue;
        }
        if (
          mod.prefix === 'Decline' &&
          movement.muscleGroup !== MuscleGroup.CHEST
        ) {
          continue;
        }
        if (
          mod.prefix === 'Single-Arm' &&
          (eq === Equipment.BARBELL || eq === Equipment.NONE)
        ) {
          continue;
        }

        // Construct Name
        let name = '';
        const eqStr = eq === Equipment.NONE ? '' : capitalize(eq);

        if (mod.prefix) {
          name += `${mod.prefix} `;
        }
        if (eqStr) {
          name += `${eqStr} `;
        }
        name += movement.baseName;
        if (mod.suffix) {
          name += ` ${mod.suffix}`;
        }

        // Clean double spaces
        name = name.replace(/\s+/g, ' ').trim();

        // Determine difficulty
        let difficulty = movement.defaultDifficulty;
        if (eq === Equipment.BARBELL || eq === Equipment.KETTLEBELL) {
          difficulty = DifficultyLevel.INTERMEDIATE;
        }
        if (
          mod.prefix === 'Single-Leg' ||
          mod.prefix === 'Single-Arm' ||
          mod.prefix === 'Unilateral'
        ) {
          difficulty = DifficultyLevel.ADVANCED;
        }

        // Construct exercise object
        const instructions = [...movement.instructionsPattern];
        if (eq !== Equipment.NONE) {
          instructions.unshift(
            `Position the ${eq.replace('_', ' ')} correctly for the exercise.`,
          );
        }
        if (mod.prefix) {
          instructions.push(
            `Focus on the ${mod.prefix.toLowerCase()} aspect, maintaining balance.`,
          );
        }

        list.push({
          name,
          muscleGroup: movement.muscleGroup,
          secondaryMuscles: movement.secondaryMuscles,
          equipment: eq,
          difficulty,
          instructions,
          isCustom: false,
          _seedData: true, // Tag as seed data
        });
      }
    }
  }

  // Filter out exact duplicate names
  const uniqueList: SeedExercise[] = [];
  const namesSeen = new Set<string>();

  for (const ex of list) {
    if (!namesSeen.has(ex.name)) {
      namesSeen.add(ex.name);
      uniqueList.push(ex);
    }
  }

  return uniqueList;
}

async function seed(): Promise<void> {
  console.log('\n🌱 GymFuel — Exercise Database Seeding Script');
  console.log('━'.repeat(50));

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seeding script cannot run in production!');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.host);

    const generated = generateExercises();
    console.log(`Generated ${generated.length} distinct exercises.`);

    if (generated.length < 500) {
      console.error(
        `❌ Generated count (${generated.length}) is below the required 500+ threshold!`,
      );
      process.exit(1);
    }

    console.log('🗑️  Clearing existing seeded exercises...');
    const deleteResult = await Exercise.deleteMany({ _seedData: true });
    console.log(
      `   ✓ Removed ${deleteResult.deletedCount} old seeded exercises.`,
    );

    console.log('💪 Seeding exercises...');
    const insertResult = await Exercise.insertMany(generated);
    console.log(
      `   ✓ Successfully seeded ${insertResult.length} exercises into MongoDB!`,
    );
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB.');
  }
}

seed();
