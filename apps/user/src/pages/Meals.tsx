import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Search,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Sparkles,
  Info,
  Scale,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { foodApi } from '../api/foodApi';
import { mealsApi } from '../api/mealsApi';
import { IFoodItem, IMealEntry, IDailyTotals } from 'gymfuel-shared';
import './Meals.css';

const LIME = '#C8FF00';
const CYAN = '#00E5FF';
const ORANGE = '#FF6B35';

interface IMealEntryWithIndex extends IMealEntry {
  originalIndex: number;
}

export default function MealsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Targets from user goals
  const calorieGoal = user?.goals?.targetCalories ?? 2000;
  const proteinGoal = user?.goals?.targetProtein ?? 150;
  const carbsGoal = user?.goals?.targetCarbs ?? 200;
  const fatGoal = user?.goals?.targetFat ?? 65;

  // Search & Logging States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IFoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<IFoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);
  const [mealType, setMealType] = useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('breakfast');

  // Logs States
  const [logId, setLogId] = useState<string | null>(null);
  const [meals, setMeals] = useState<IMealEntryWithIndex[]>([]);
  const [totals, setTotals] = useState<IDailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    waterGlasses: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce query search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Execute Search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchSearch = async () => {
      setSearching(true);
      setError(null);
      try {
        const res = await foodApi.search(debouncedQuery);
        setSearchResults(res.results);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to search food.');
      } finally {
        setSearching(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery]);

  // Fetch today's log on mount
  const fetchTodayLog = async () => {
    setLoading(true);
    setError(null);
    try {
      const log = await mealsApi.getTodayLog();
      setLogId(log.logId ?? null);

      // Map meals with their original index in the API array for delete endpoint
      const mealsWithIndex = log.meals.map((m, idx) => ({
        ...m,
        originalIndex: idx,
      }));
      setMeals(mealsWithIndex);
      setTotals(log.totals);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch today's meals.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLog();
  }, []);

  // Handle Log Food Submission
  const handleLogFood = async () => {
    if (!selectedFood) return;
    setActionLoading(true);
    setError(null);
    try {
      const foodId = selectedFood._id;
      const logged = await mealsApi.logMeal(foodId, portionGrams, mealType);

      // Update local states
      const mealsWithIndex = logged.meals.map((m, idx) => ({
        ...m,
        originalIndex: idx,
      }));
      setMeals(mealsWithIndex);
      setTotals(logged.totals);
      setLogId(logged._id);

      // Clear search
      setSelectedFood(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to log food.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (originalIndex: number) => {
    if (!logId) return;
    if (!window.confirm('Are you sure you want to delete this meal entry?'))
      return;
    setActionLoading(true);
    setError(null);
    try {
      const updatedLog = await mealsApi.deleteMealEntry(logId, originalIndex);
      const mealsWithIndex = updatedLog.meals.map((m, idx) => ({
        ...m,
        originalIndex: idx,
      }));
      setMeals(mealsWithIndex);
      setTotals(updatedLog.totals);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete meal entry.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Group meals by type
  const getMealsByType = (type: string) => {
    return meals.filter((m) => m.mealType === type);
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast':
        return (
          <Coffee
            size={18}
            className="meal-sect-icon"
            style={{ color: CYAN }}
          />
        );
      case 'lunch':
        return (
          <Sun size={18} className="meal-sect-icon" style={{ color: LIME }} />
        );
      case 'dinner':
        return (
          <Moon
            size={18}
            className="meal-sect-icon"
            style={{ color: ORANGE }}
          />
        );
      default:
        return (
          <Cookie
            size={18}
            className="meal-sect-icon"
            style={{ color: '#A855F7' }}
          />
        );
    }
  };

  const calPct = Math.min(
    100,
    Math.round((totals.calories / calorieGoal) * 100),
  );

  return (
    <div className="meals-root" data-testid="meals-page">
      {/* Background Cinematic Orbs */}
      <div className="meals-orbs" aria-hidden>
        <div className="meals-orb-1" />
        <div className="meals-orb-2" />
        <div className="meals-orb-3" />
      </div>

      {/* Navigation */}
      <nav className="meals-nav">
        <button
          className="meals-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={20} /> Dashboard
        </button>
        <div className="meals-nav-title">Meal Logger</div>
      </nav>

      <div className="meals-page">
        {/* Header Section */}
        <div className="meals-header">
          <div className="meals-header-info">
            <h1 className="meals-title">Nutrition Tracker</h1>
            <p className="meals-subtitle">
              Fuel your body with calculated precision.
            </p>
          </div>
        </div>

        {/* Daily Summary Bento Cards */}
        <div className="meals-summary-grid" data-testid="daily-summary">
          {/* Calorie Card */}
          <div className="meals-summary-card calories">
            <div
              className="meals-summary-glow"
              style={{ backgroundColor: LIME }}
            />
            <div className="meals-summary-title">Calories</div>
            <div className="meals-summary-main">
              <span className="meals-summary-val" data-testid="total-calories">
                {totals.calories.toLocaleString()}
              </span>
              <span className="meals-summary-goal">/ {calorieGoal} kcal</span>
            </div>
            <div className="meals-progress-track">
              <div
                className="meals-progress-fill"
                style={{
                  width: `${calPct}%`,
                  backgroundColor: LIME,
                  boxShadow: `0 0 10px ${LIME}88`,
                }}
              />
            </div>
            <div
              className="meals-summary-meta"
              style={{ color: calPct > 100 ? ORANGE : 'rgba(255,255,255,0.4)' }}
            >
              {calPct}% of daily target
            </div>
          </div>

          {/* Macros Mini Bento */}
          <div className="meals-macros-card">
            {[
              {
                label: 'Protein',
                current: totals.protein,
                goal: proteinGoal,
                color: LIME,
                unit: 'g',
                emoji: '🥩',
              },
              {
                label: 'Carbs',
                current: totals.carbs,
                goal: carbsGoal,
                color: CYAN,
                unit: 'g',
                emoji: '🌾',
              },
              {
                label: 'Fat',
                current: totals.fat,
                goal: fatGoal,
                color: ORANGE,
                unit: 'g',
                emoji: '🥑',
              },
            ].map((macro) => {
              const pct = Math.min(
                100,
                Math.round((macro.current / macro.goal) * 100),
              );
              return (
                <div key={macro.label} className="meals-macro-row">
                  <div className="meals-macro-info">
                    <span className="meals-macro-label">
                      {macro.emoji} {macro.label}
                    </span>
                    <span className="meals-macro-values">
                      <strong>{macro.current}g</strong> / {macro.goal}g
                    </span>
                  </div>
                  <div className="meals-macro-track">
                    <div
                      className="meals-macro-fill"
                      style={{ width: `${pct}%`, backgroundColor: macro.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="meals-error-banner">
            <Info size={18} /> {error}
          </div>
        )}

        {/* Bento: Left Side Food Search & Right Side Logged Sections */}
        <div className="meals-content-layout">
          {/* Column 1: Food Lookup */}
          <div className="meals-left-column">
            <div className="meals-search-card">
              <h2 className="meals-card-title">🔍 Search & Log Food</h2>
              <p className="meals-card-subtitle">
                Lookup food items from USDA & Open Food Facts.
              </p>

              <div className="meals-search-input-wrapper">
                <Search size={18} className="meals-search-icon" />
                <input
                  type="text"
                  className="meals-search-input"
                  data-testid="food-search-input"
                  placeholder="Search banana, chicken breast, milk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && <div className="meals-search-spinner" />}
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    data-testid="search-results-list"
                    className="meals-search-results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {searchResults.map((food) => (
                      <div
                        key={food._id}
                        className="meals-search-item"
                        data-testid={`search-result-item-${food._id}`}
                        onClick={() => {
                          setSelectedFood(food);
                          setPortionGrams(food.servingSize || 100);
                        }}
                      >
                        <div className="meals-search-item-header">
                          <span className="meals-item-name">{food.name}</span>
                          {food.brand && (
                            <span className="meals-item-brand">
                              {food.brand}
                            </span>
                          )}
                        </div>
                        <div className="meals-item-nut-preview">
                          <span>🔥 {food.nutrition.calories} kcal</span>
                          <span>🥩 P: {food.nutrition.protein}g</span>
                          <span>🌾 C: {food.nutrition.carbs}g</span>
                          <span>🥑 F: {food.nutrition.fat}g</span>
                          <span>
                            ({food.servingSize}
                            {food.servingUnit || 'g'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {searchQuery.trim().length >= 2 &&
                searchResults.length === 0 &&
                !searching && (
                  <div className="meals-no-results">
                    No food items found. Try a different query.
                  </div>
                )}
            </div>

            {/* Logging Form (Conditional on selectedFood) */}
            <AnimatePresence>
              {selectedFood && (
                <motion.div
                  className="meals-log-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="meals-log-panel-inner">
                    <h3 className="meals-log-panel-title">
                      <Sparkles size={16} style={{ color: LIME }} /> Configure
                      Entry
                    </h3>
                    <div className="meals-selected-food-details">
                      <strong>{selectedFood.name}</strong>
                      {selectedFood.brand && (
                        <span> | {selectedFood.brand}</span>
                      )}
                    </div>

                    <div className="meals-log-fields">
                      <div className="meals-field">
                        <label className="meals-label">
                          <Scale size={14} /> Portion Size (g)
                        </label>
                        <input
                          type="number"
                          className="meals-input"
                          data-testid="portion-input"
                          min={1}
                          value={portionGrams}
                          onChange={(e) =>
                            setPortionGrams(Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="meals-field">
                        <label className="meals-label">Meal Section</label>
                        <select
                          className="meals-select"
                          data-testid="meal-type-select"
                          value={mealType}
                          onChange={(e) =>
                            setMealType(
                              e.target.value as
                                | 'breakfast'
                                | 'lunch'
                                | 'dinner'
                                | 'snack',
                            )
                          }
                        >
                          <option value="breakfast">☕ Breakfast</option>
                          <option value="lunch">☀️ Lunch</option>
                          <option value="dinner">🌙 Dinner</option>
                          <option value="snack">🍪 Snack</option>
                        </select>
                      </div>
                    </div>

                    {/* Calculated Portion Preview */}
                    <div className="meals-portion-preview">
                      <div className="meals-preview-title">
                        Portion Nutrition Facts
                      </div>
                      <div className="meals-preview-grid">
                        <div className="meals-preview-item">
                          <span>Calories</span>
                          <strong>
                            {Math.round(
                              (selectedFood.nutrition.calories * portionGrams) /
                                (selectedFood.servingSize || 100),
                            )}{' '}
                            kcal
                          </strong>
                        </div>
                        <div className="meals-preview-item">
                          <span>Protein</span>
                          <strong>
                            {Math.round(
                              ((selectedFood.nutrition.protein * portionGrams) /
                                (selectedFood.servingSize || 100)) *
                                10,
                            ) / 10}
                            g
                          </strong>
                        </div>
                        <div className="meals-preview-item">
                          <span>Carbs</span>
                          <strong>
                            {Math.round(
                              ((selectedFood.nutrition.carbs * portionGrams) /
                                (selectedFood.servingSize || 100)) *
                                10,
                            ) / 10}
                            g
                          </strong>
                        </div>
                        <div className="meals-preview-item">
                          <span>Fat</span>
                          <strong>
                            {Math.round(
                              ((selectedFood.nutrition.fat * portionGrams) /
                                (selectedFood.servingSize || 100)) *
                                10,
                            ) / 10}
                            g
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="meals-log-actions">
                      <button
                        className="meals-btn-cancel"
                        data-testid="cancel-log-btn"
                        onClick={() => setSelectedFood(null)}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="meals-btn-submit"
                        data-testid="log-food-btn"
                        onClick={handleLogFood}
                        disabled={actionLoading || portionGrams <= 0}
                      >
                        {actionLoading ? 'Logging...' : 'Log Food ⚡'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Column 2: Logged Meals sections */}
          <div className="meals-right-column">
            {loading ? (
              <div className="meals-loading-spinner-wrapper">
                <div className="meals-search-spinner" />
                <span
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}
                >
                  Loading logs...
                </span>
              </div>
            ) : (
              <div className="meals-sections-container">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
                  const sectionMeals = getMealsByType(type);
                  return (
                    <div
                      key={type}
                      className="meals-section-card"
                      data-testid={`section-${type}`}
                    >
                      <div className="meals-section-header">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          {getMealTypeIcon(type)}
                          <h3 className="meals-section-title">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </h3>
                        </div>
                        <span className="meals-section-totals">
                          {sectionMeals.reduce(
                            (acc, cur) => acc + cur.nutrition.calories,
                            0,
                          )}{' '}
                          kcal
                        </span>
                      </div>

                      <div className="meals-section-list">
                        {sectionMeals.length === 0 ? (
                          <div className="meals-section-empty">
                            No items logged yet.
                          </div>
                        ) : (
                          <AnimatePresence>
                            {sectionMeals.map((meal) => (
                              <motion.div
                                key={meal.originalIndex}
                                className="meals-logged-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                              >
                                <div className="meals-logged-item-info">
                                  <div className="meals-logged-item-name">
                                    {meal.foodName}
                                  </div>
                                  <div className="meals-logged-item-macros">
                                    <span>{meal.portionGrams}g</span>
                                    <span className="dot">•</span>
                                    <span style={{ color: LIME }}>
                                      P: {meal.nutrition.protein}g
                                    </span>
                                    <span className="dot">•</span>
                                    <span style={{ color: CYAN }}>
                                      C: {meal.nutrition.carbs}g
                                    </span>
                                    <span className="dot">•</span>
                                    <span style={{ color: ORANGE }}>
                                      F: {meal.nutrition.fat}g
                                    </span>
                                  </div>
                                </div>
                                <div className="meals-logged-item-actions">
                                  <span className="meals-logged-item-cals">
                                    {meal.nutrition.calories} kcal
                                  </span>
                                  <button
                                    className="meals-delete-btn"
                                    data-testid={`delete-meal-btn-${meal.originalIndex}`}
                                    onClick={() =>
                                      handleDeleteEntry(meal.originalIndex)
                                    }
                                    disabled={actionLoading}
                                    title="Delete meal entry"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
