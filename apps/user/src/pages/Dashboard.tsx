import { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Dashboard.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MealLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const LIME = '#C8FF00';
const CYAN = '#00E5FF';
const ORANGE = '#FF6B35';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionVal.set(value);
  }, [value]);
  useEffect(
    () => spring.on('change', (v) => setDisplay(Math.round(v))),
    [spring],
  );

  return (
    <>
      {display.toLocaleString()}
      {suffix}
    </>
  );
}

// ─── SVG Calorie Ring ─────────────────────────────────────────────────────────
function CalorieRing({
  pct,
  total,
  goal,
}: {
  pct: number;
  total: number;
  goal: number;
}) {
  const radius = 82;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = pct < 50 ? CYAN : pct < 80 ? ORANGE : LIME;

  return (
    <div
      style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}
    >
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="14"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          filter="url(#glow)"
        />
      </svg>
      {/* Center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 3,
          }}
        >
          Consumed
        </div>
        <div
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          <AnimatedNumber value={total} />
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.35)',
            marginTop: 3,
          }}
        >
          / {goal.toLocaleString()} kcal
        </div>
        <div
          style={{
            marginTop: 7,
            padding: '2px 9px',
            borderRadius: 20,
            backgroundColor: `${color}18`,
            border: `1px solid ${color}38`,
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Macro Card ────────────────────────────────────────────────────────────────
function MacroCard({
  label,
  current,
  goal,
  color,
  icon,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
  icon: string;
}) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0);
  return (
    <div className="dash-macro-card">
      <div
        className="dash-macro-glow"
        style={{ backgroundColor: color, opacity: 0.08 }}
      />
      <div className="dash-macro-header">
        <div>
          <div className="dash-macro-label">{label}</div>
          <div className="dash-macro-val">
            <AnimatedNumber value={current} suffix="g" />
          </div>
          <div className="dash-macro-goal">of {goal}g</div>
        </div>
        <div
          className="dash-macro-icon"
          style={{
            backgroundColor: `${color}14`,
            border: `1px solid ${color}28`,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="dash-macro-bar-track">
        <motion.div
          className="dash-macro-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{
            background: `linear-gradient(90deg, ${color}70, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
      <div className="dash-macro-pct" style={{ color }}>
        {pct}%
      </div>
    </div>
  );
}

// ─── Hydration Card ────────────────────────────────────────────────────────────
function HydrationCard({
  glasses,
  goal,
  onAdd,
  onRemove,
}: {
  glasses: number;
  goal: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const pct = Math.min(1, goal > 0 ? glasses / goal : 0);
  const displayGoal = Math.max(goal, 8);

  return (
    <div className="dash-card dash-cell-hydration">
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 140,
          height: 140,
          borderRadius: '50%',
          backgroundColor: CYAN,
          opacity: 0.04,
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />

      <div className="dash-hydration-header">
        <div>
          <div className="dash-hydration-label">💧 Hydration</div>
          <div className="dash-hydration-count">
            <AnimatedNumber value={glasses} />
            <span> / {goal} glasses</span>
          </div>
        </div>
      </div>

      <div className="dash-hydration-body">
        {/* Wave Jar */}
        <div className="dash-water-jar">
          <svg
            className="dash-water-jar-fill"
            style={{ height: `${pct * 100}%` }}
            viewBox="0 0 60 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waterG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CYAN} stopOpacity="0.55" />
                <stop offset="100%" stopColor={CYAN} stopOpacity="0.88" />
              </linearGradient>
            </defs>
            <path
              fill="url(#waterG)"
              d="M0,30 C15,20 45,40 60,30 L60,100 L0,100 Z"
            >
              <animate
                attributeName="d"
                dur="5s"
                repeatCount="indefinite"
                values="M0,30 C15,20 45,40 60,30 L60,100 L0,100 Z;M0,30 C15,40 45,20 60,30 L60,100 L0,100 Z;M0,30 C15,20 45,40 60,30 L60,100 L0,100 Z"
              />
            </path>
          </svg>
          <div className="dash-water-jar-label">{Math.round(pct * 100)}%</div>
        </div>

        {/* +/- Buttons */}
        <div className="dash-water-btns">
          <button
            className="dash-water-btn dash-water-btn-add"
            onClick={onAdd}
            title="Add glass"
          >
            +
          </button>
          <button
            className="dash-water-btn dash-water-btn-remove"
            onClick={onRemove}
            disabled={glasses === 0}
            title="Remove glass"
          >
            −
          </button>
        </div>
      </div>

      {/* Glass Icon Grid */}
      <div className="dash-hydration-glasses">
        {Array.from({ length: displayGoal }).map((_, i) => (
          <div
            key={i}
            className={`dash-glass-icon ${i < glasses ? 'dash-glass-filled' : 'dash-glass-empty'}`}
          >
            {i < glasses ? '💧' : '○'}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Meal Item ─────────────────────────────────────────────────────────────────
function MealItem({
  meal,
  onDelete,
}: {
  meal: MealLog;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="dash-meal-item"
    >
      <div className="dash-meal-info">
        <div className="dash-meal-name">{meal.name}</div>
        <div className="dash-meal-tags">
          <span
            className="dash-meal-tag"
            style={{ color: LIME, backgroundColor: `${LIME}12` }}
          >
            P {meal.protein}g
          </span>
          <span
            className="dash-meal-tag"
            style={{ color: CYAN, backgroundColor: `${CYAN}12` }}
          >
            C {meal.carbs}g
          </span>
          <span
            className="dash-meal-tag"
            style={{ color: ORANGE, backgroundColor: `${ORANGE}12` }}
          >
            F {meal.fat}g
          </span>
          <span
            className="dash-meal-tag"
            style={{
              color: 'rgba(255,255,255,0.25)',
              backgroundColor: 'transparent',
            }}
          >
            {meal.timestamp}
          </span>
        </div>
      </div>
      <div className="dash-meal-actions">
        <span className="dash-meal-calories">
          {meal.calories.toLocaleString()} kcal
        </span>
        <button
          className="dash-meal-delete"
          onClick={() => onDelete(meal.id)}
          title="Delete meal"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// ─── Add Meal Modal (Bottom Sheet on Mobile, Centered on Desktop) ──────────────
function AddMealModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (m: Omit<MealLog, 'id' | 'timestamp'>) => void;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter a meal name.');
    const c = parseInt(calories);
    if (isNaN(c) || c <= 0)
      return setError('Please enter a valid calorie amount.');
    onAdd({
      name: name.trim(),
      calories: c,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
    });
  };

  return (
    <motion.div
      className="dash-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="dash-modal-sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-modal-glow" />
        <div className="dash-modal-handle" />
        <h3 className="dash-modal-title">Log Fuel 🍽️</h3>

        {error && <div className="dash-modal-error">{error}</div>}

        <form className="dash-form" onSubmit={handleSubmit}>
          <div className="dash-field">
            <label className="dash-label">Meal Name</label>
            <input
              className="dash-input"
              type="text"
              placeholder="e.g. Grilled Chicken & Rice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="dash-field">
            <label className="dash-label">Calories (kcal)</label>
            <input
              className="dash-input"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 650"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>

          <div className="dash-macro-inputs">
            <div className="dash-field">
              <label className="dash-label" style={{ color: LIME }}>
                Protein (g)
              </label>
              <input
                className="dash-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                style={{ borderColor: `${LIME}22` }}
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
            <div className="dash-field">
              <label className="dash-label" style={{ color: CYAN }}>
                Carbs (g)
              </label>
              <input
                className="dash-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                style={{ borderColor: `${CYAN}22` }}
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="dash-field">
              <label className="dash-label" style={{ color: ORANGE }}>
                Fat (g)
              </label>
              <input
                className="dash-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                style={{ borderColor: `${ORANGE}22` }}
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-form-btns">
            <button type="button" className="dash-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dash-btn-submit">
              Add to Log ⚡
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [water, setWater] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const calorieGoal = user?.goals?.targetCalories ?? 2000;
  const proteinGoal = user?.goals?.targetProtein ?? 150;
  const carbsGoal = user?.goals?.targetCarbs ?? 200;
  const fatGoal = user?.goals?.targetFat ?? 65;
  const waterGoal = user?.goals?.targetWaterGlasses ?? 8;

  // ── Persist per day ───────────────────────────────────────────────────────
  useEffect(() => {
    const key = new Date().toDateString();
    const m = localStorage.getItem(`gf_meals_${key}`);
    const w = localStorage.getItem(`gf_water_${key}`);
    if (m) setMeals(JSON.parse(m));
    if (w) setWater(parseInt(w) || 0);
  }, []);

  const saveMeals = (list: MealLog[]) => {
    setMeals(list);
    localStorage.setItem(
      `gf_meals_${new Date().toDateString()}`,
      JSON.stringify(list),
    );
  };

  const saveWater = (n: number) => {
    setWater(n);
    localStorage.setItem(`gf_water_${new Date().toDateString()}`, String(n));
  };

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalPro = meals.reduce((s, m) => s + m.protein, 0);
  const totalCarb = meals.reduce((s, m) => s + m.carbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat, 0);
  const calPct = Math.min(100, Math.round((totalCal / calorieGoal) * 100));
  const remaining = Math.max(0, calorieGoal - totalCal);
  const ringColor = calPct < 50 ? CYAN : calPct < 80 ? ORANGE : LIME;

  const addMeal = (data: Omit<MealLog, 'id' | 'timestamp'>) => {
    const meal: MealLog = {
      ...data,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    saveMeals([meal, ...meals]);
    setShowModal(false);
  };

  const deleteMeal = (id: string) =>
    saveMeals(meals.filter((m) => m.id !== id));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dash-root" data-testid="dashboard-page">
      {/* ── Cinematic Background Orbs ────────────────────────────────── */}
      <div className="dash-orbs" aria-hidden>
        <div className="dash-orb-1" />
        <div className="dash-orb-2" />
        <div className="dash-orb-3" />
      </div>

      {/* ── Top Navigation ───────────────────────────────────────────── */}
      <nav className="dash-nav">
        <div className="dash-nav-brand">
          <div className="dash-nav-logo">G</div>
          <span className="dash-nav-title">GymFuel</span>
        </div>
        <div className="dash-nav-right">
          <Link
            to="/scanner"
            style={{
              background: 'linear-gradient(135deg, #c8ff00, #8bc34a)',
              color: '#0b0b0f',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            📸 Scan Food
          </Link>
          {user?.name && <div className="dash-nav-user">👤 {user.name}</div>}
          <button
            className="dash-nav-logout"
            data-testid="logout-btn"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* ── Page Content ─────────────────────────────────────────────── */}
      <div className="dash-page">
        {/* Hero Header */}
        <motion.div
          className="dash-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dash-hero-label">⚡ {dateStr}</div>
          <h1 className="dash-hero-title">
            {greeting},<br />
            <span className="dash-hero-gradient">
              {user?.name || 'Champion'} 🔥
            </span>
          </h1>
          <p className="dash-hero-sub">
            {remaining > 0 ? (
              <>
                You have{' '}
                <strong style={{ color: '#fff' }}>
                  {remaining.toLocaleString()} kcal
                </strong>{' '}
                left today. Keep pushing.
              </>
            ) : (
              <span style={{ color: LIME, fontWeight: 700 }}>
                🌟 Daily target crushed! Outstanding nutrition today.
              </span>
            )}
          </p>
        </motion.div>

        {/* ── BENTO GRID ──────────────────────────────────────────────── */}
        <div className="dash-grid">
          {/* Calorie Ring Card */}
          <motion.div
            className="dash-card dash-cell-calring"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="dash-ring-glow" />
            <CalorieRing pct={calPct} total={totalCal} goal={calorieGoal} />
            <div className="dash-ring-stats">
              {[
                {
                  label: 'Burned',
                  val: `${totalCal.toLocaleString()} kcal`,
                  color: ringColor,
                },
                {
                  label: 'Remaining',
                  val: `${remaining.toLocaleString()} kcal`,
                  color: 'rgba(255,255,255,0.55)',
                },
                {
                  label: 'Daily Goal',
                  val: `${calorieGoal.toLocaleString()} kcal`,
                  color: 'rgba(255,255,255,0.3)',
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="dash-ring-stat-label">{s.label}</div>
                  <div
                    className="dash-ring-stat-val"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Macros Column */}
          <motion.div
            className="dash-cell-macros"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <MacroCard
              label="Protein"
              current={totalPro}
              goal={proteinGoal}
              color={LIME}
              icon="🥩"
            />
            <MacroCard
              label="Carbohydrates"
              current={totalCarb}
              goal={carbsGoal}
              color={CYAN}
              icon="🌾"
            />
            <MacroCard
              label="Fats"
              current={totalFat}
              goal={fatGoal}
              color={ORANGE}
              icon="🥑"
            />
          </motion.div>

          {/* Hydration Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <HydrationCard
              glasses={water}
              goal={waterGoal}
              onAdd={() => saveWater(Math.min(waterGoal + 4, water + 1))}
              onRemove={() => saveWater(Math.max(0, water - 1))}
            />
          </motion.div>

          {/* Action Row */}
          <motion.div
            className="dash-cell-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <button className="dash-cta-btn" onClick={() => setShowModal(true)}>
              <span>⚡</span> Log Today's Fuel
            </button>
            <div className="dash-stats-pills">
              <div className="dash-stat-pill">
                <span className="dash-stat-pill-label">Meals</span>
                <span
                  className="dash-stat-pill-val"
                  style={{ color: '#A855F7' }}
                >
                  {meals.length}
                </span>
              </div>
              <div className="dash-stat-pill">
                <span className="dash-stat-pill-label">Progress</span>
                <span
                  className="dash-stat-pill-val"
                  style={{ color: ringColor }}
                >
                  {calPct}%
                </span>
              </div>
              <div className="dash-stat-pill">
                <span className="dash-stat-pill-label">Water</span>
                <span className="dash-stat-pill-val" style={{ color: CYAN }}>
                  {water}/{waterGoal}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Meal Log Feed */}
          <motion.div
            className="dash-card dash-cell-log"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <div className="dash-log-header">
              <div>
                <h2 className="dash-log-title">Today's Fuel Log</h2>
                <p className="dash-log-subtitle">
                  {meals.length === 0
                    ? 'No meals logged yet — start fueling!'
                    : `${meals.length} meal${meals.length > 1 ? 's' : ''} logged`}
                </p>
              </div>
              {meals.length > 0 && (
                <button
                  className="dash-log-clear"
                  onClick={() => {
                    if (window.confirm("Reset all today's meals?"))
                      saveMeals([]);
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {meals.length === 0 ? (
              <div className="dash-log-empty">
                <div className="dash-log-empty-icon">🍽️</div>
                <h3 className="dash-log-empty-title">Your fuel log is empty</h3>
                <p className="dash-log-empty-desc">
                  Hit <strong style={{ color: LIME }}>Log Today's Fuel</strong>{' '}
                  to start tracking your nutrition.
                </p>
              </div>
            ) : (
              <div className="dash-log-list">
                <AnimatePresence mode="popLayout">
                  {meals.map((m) => (
                    <MealItem key={m.id} meal={m} onDelete={deleteMeal} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
        {/* END GRID */}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <AddMealModal onClose={() => setShowModal(false)} onAdd={addMeal} />
        )}
      </AnimatePresence>
    </div>
  );
}
