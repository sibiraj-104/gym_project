// ============================================================
// GymFuel — Database Index Initialization Script
// Run: pnpm --filter gymfuel-server run db:init
//
// Creates all MongoDB indexes for optimal query performance.
// This is IDEMPOTENT — safe to run multiple times.
// ============================================================

import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gymfuel';

async function createIndexes(): Promise<void> {
  console.log('\n🏗️  GymFuel — Database Index Initialization');
  console.log('━'.repeat(50));

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.host);

  const db = mongoose.connection.db!;

  // ── users ───────────────────────────────────────────────────
  console.log('\n📋 Creating indexes for: users');
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
  await users.createIndex(
    { googleId: 1 },
    { sparse: true, name: 'googleId_sparse' },
  );
  await users.createIndex({ role: 1 }, { name: 'role' });
  await users.createIndex({ createdAt: -1 }, { name: 'createdAt_desc' });
  await users.createIndex({ lastActiveAt: -1 }, { name: 'lastActiveAt_desc' });
  console.log(
    '   ✓ email (unique), googleId (sparse), role, createdAt, lastActiveAt',
  );

  // ── food_items ─────────────────────────────────────────────
  console.log('\n🍎 Creating indexes for: food_items');
  const foods = db.collection('food_items');
  await foods.createIndex(
    { barcode: 1 },
    { unique: true, sparse: true, name: 'barcode_unique_sparse' },
  );
  await foods.createIndex(
    { name: 'text', brand: 'text' },
    { name: 'food_text_search', weights: { name: 10, brand: 5 } },
  );
  await foods.createIndex({ source: 1 }, { name: 'source' });
  await foods.createIndex({ isApproved: 1 }, { name: 'isApproved' });
  await foods.createIndex({ reportCount: -1 }, { name: 'reportCount_desc' });
  console.log(
    '   ✓ barcode (unique sparse), text(name+brand), source, isApproved, reportCount',
  );

  // ── meal_logs ──────────────────────────────────────────────
  console.log('\n🥗 Creating indexes for: meal_logs');
  const mealLogs = db.collection('meal_logs');
  await mealLogs.createIndex(
    { userId: 1, date: 1 },
    { unique: true, name: 'userId_date_unique' },
  );
  await mealLogs.createIndex(
    { userId: 1, date: -1 },
    { name: 'userId_date_desc' },
  );
  console.log('   ✓ (userId + date) compound unique, (userId + date) desc');

  // ── workout_logs ────────────────────────────────────────────
  console.log('\n🏋️  Creating indexes for: workout_logs');
  const workoutLogs = db.collection('workout_logs');
  await workoutLogs.createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'userId_createdAt_desc' },
  );
  await workoutLogs.createIndex({ userId: 1 }, { name: 'userId' });
  console.log('   ✓ (userId + createdAt) desc, userId');

  // ── exercises ─────────────────────────────────────────────
  console.log('\n💪 Creating indexes for: exercises');
  const exercises = db.collection('exercises');
  await exercises.createIndex({ muscleGroup: 1 }, { name: 'muscleGroup' });
  await exercises.createIndex({ equipment: 1 }, { name: 'equipment' });
  await exercises.createIndex({ difficulty: 1 }, { name: 'difficulty' });
  await exercises.createIndex(
    { name: 'text' },
    { name: 'exercise_text_search' },
  );
  await exercises.createIndex(
    { muscleGroup: 1, difficulty: 1 },
    { name: 'muscleGroup_difficulty' },
  );
  console.log('   ✓ muscleGroup, equipment, difficulty, text(name), compound');

  // ── workout_templates ──────────────────────────────────────
  console.log('\n📋 Creating indexes for: workout_templates');
  const templates = db.collection('workout_templates');
  await templates.createIndex({ isPublished: 1 }, { name: 'isPublished' });
  await templates.createIndex({ difficulty: 1 }, { name: 'difficulty' });
  await templates.createIndex({ targetMuscles: 1 }, { name: 'targetMuscles' });
  console.log('   ✓ isPublished, difficulty, targetMuscles');

  // ── ai_chat_history ────────────────────────────────────────
  console.log('\n🤖 Creating indexes for: ai_chat_history');
  const chatHistory = db.collection('ai_chat_history');
  await chatHistory.createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'userId_createdAt_desc' },
  );
  console.log('   ✓ (userId + createdAt) desc');

  // ── notifications ──────────────────────────────────────────
  console.log('\n🔔 Creating indexes for: notifications');
  const notifications = db.collection('notifications');
  await notifications.createIndex(
    { userId: 1, isRead: 1 },
    { name: 'userId_isRead' },
  );
  await notifications.createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'userId_createdAt_desc' },
  );
  console.log('   ✓ (userId + isRead), (userId + createdAt) desc');

  // ── body_measurements ─────────────────────────────────────
  console.log('\n📏 Creating indexes for: body_measurements');
  const measurements = db.collection('body_measurements');
  await measurements.createIndex(
    { userId: 1, date: -1 },
    { name: 'userId_date_desc' },
  );
  console.log('   ✓ (userId + date) desc');

  // ── admin_audit_logs ───────────────────────────────────────
  console.log('\n📝 Creating indexes for: admin_audit_logs');
  const auditLogs = db.collection('admin_audit_logs');
  await auditLogs.createIndex(
    { adminId: 1, createdAt: -1 },
    { name: 'adminId_createdAt_desc' },
  );
  await auditLogs.createIndex({ action: 1 }, { name: 'action' });
  await auditLogs.createIndex({ createdAt: -1 }, { name: 'createdAt_desc' });
  // TTL index — auto-delete audit logs after 1 year
  await auditLogs.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60, name: 'ttl_1year' },
  );
  console.log('   ✓ (adminId + createdAt), action, TTL (1 year auto-delete)');

  // ── feature_flags ──────────────────────────────────────────
  console.log('\n🚩 Creating indexes for: feature_flags');
  const flags = db.collection('feature_flags');
  await flags.createIndex({ key: 1 }, { unique: true, name: 'key_unique' });
  console.log('   ✓ key (unique)');

  console.log('\n' + '━'.repeat(50));
  console.log('✅ All indexes created successfully!\n');
}

createIndexes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Index creation failed:', err.message);
    process.exit(1);
  });
