import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  calculatorApi,
  TDEEResponse,
  BMIResponse,
  ProteinResponse,
  OneRepMaxResponse,
} from '../api/calculatorApi';
import {
  calculateTDEE,
  calculateMacroTargets,
  calculateBMI,
  calculateProteinTarget,
  calculateEpley1RM,
  Gender,
  ActivityLevel,
  FitnessGoal,
} from 'gymfuel-shared';

import {
  ChevronLeft,
  Flame,
  Activity,
  Sparkles,
  Dumbbell,
  Target,
} from 'lucide-react';
import './Calculator.css';

// Accent Colors
const LIME = '#C8FF00';
const CYAN = '#00E5FF';
const ORANGE = '#FF6B35';
const PURPLE = '#A855F7';

type TabType = 'tdee' | 'bmi' | 'protein' | '1rm';

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('tdee');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefill inputs from user profile if available
  const initialWeight = user?.profile?.weight || 70;
  const initialHeight = user?.profile?.height || 170;
  const initialAge = user?.profile?.age || 25;
  const initialGender = user?.profile?.gender || Gender.MALE;
  const initialActivity =
    user?.profile?.activityLevel || ActivityLevel.MODERATE;
  const initialGoal = user?.goals?.type || FitnessGoal.MAINTAIN_WEIGHT;

  // Form States
  // 1. TDEE & Macros Form
  const [tdeeWeight, setTdeeWeight] = useState(initialWeight.toString());
  const [tdeeHeight, setTdeeHeight] = useState(initialHeight.toString());
  const [tdeeAge, setTdeeAge] = useState(initialAge.toString());
  const [tdeeGender, setTdeeGender] = useState<Gender>(initialGender);
  const [tdeeActivity, setTdeeActivity] =
    useState<ActivityLevel>(initialActivity);
  const [tdeeGoal, setTdeeGoal] = useState<FitnessGoal>(initialGoal);
  const [tdeeResult, setTdeeResult] = useState<TDEEResponse | null>(null);

  // 2. BMI Form
  const [bmiWeight, setBmiWeight] = useState(initialWeight.toString());
  const [bmiHeight, setBmiHeight] = useState(initialHeight.toString());
  const [bmiResult, setBmiResult] = useState<BMIResponse | null>(null);

  // 3. Protein Form
  const [proteinWeight, setProteinWeight] = useState(initialWeight.toString());
  const [proteinGoal, setProteinGoal] = useState<FitnessGoal>(initialGoal);
  const [proteinResult, setProteinResult] = useState<ProteinResponse | null>(
    null,
  );

  // 4. 1-Rep Max Form
  const [ormWeight, setOrmWeight] = useState('80');
  const [ormReps, setOrmReps] = useState('5');
  const [ormResult, setOrmResult] = useState<OneRepMaxResponse | null>(null);

  // Clear errors when tab switches
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  // Handlers
  const handleTDEESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const weightVal = parseFloat(tdeeWeight);
    const heightVal = parseFloat(tdeeHeight);
    const ageVal = parseInt(tdeeAge);
    try {
      const res = await calculatorApi.getTDEE({
        weight: weightVal,
        height: heightVal,
        age: ageVal,
        gender: tdeeGender,
        activityLevel: tdeeActivity,
        goal: tdeeGoal,
      });
      setTdeeResult(res);
    } catch (err: unknown) {
      console.warn(
        'Backend TDEE calculation failed, falling back to client logic:',
        err,
      );
      try {
        const tdeeNum = calculateTDEE(
          weightVal,
          heightVal,
          ageVal,
          tdeeGender,
          tdeeActivity,
        );
        const targetsVal = calculateMacroTargets(tdeeNum, weightVal, tdeeGoal);
        setTdeeResult({
          tdee: tdeeNum,
          targets: targetsVal,
        });
      } catch {
        setError(err instanceof Error ? err.message : 'Calculation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBMISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const weightVal = parseFloat(bmiWeight);
    const heightVal = parseFloat(bmiHeight);
    try {
      const res = await calculatorApi.getBMI({
        weight: weightVal,
        height: heightVal,
      });
      setBmiResult(res);
    } catch (err: unknown) {
      console.warn(
        'Backend BMI calculation failed, falling back to client logic:',
        err,
      );
      try {
        const result = calculateBMI(weightVal, heightVal);
        setBmiResult(result);
      } catch {
        setError(err instanceof Error ? err.message : 'Calculation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProteinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const weightVal = parseFloat(proteinWeight);
    try {
      const res = await calculatorApi.getProteinRange({
        weight: weightVal,
        goal: proteinGoal,
      });
      setProteinResult(res);
    } catch (err: unknown) {
      console.warn(
        'Backend Protein calculation failed, falling back to client logic:',
        err,
      );
      try {
        const result = calculateProteinTarget(weightVal, proteinGoal);
        setProteinResult(result);
      } catch {
        setError(err instanceof Error ? err.message : 'Calculation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleORMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const weightVal = parseFloat(ormWeight);
    const repsVal = parseInt(ormReps);
    try {
      const res = await calculatorApi.getOneRepMax({
        weight: weightVal,
        reps: repsVal,
      });
      setOrmResult(res);
    } catch (err: unknown) {
      console.warn(
        'Backend 1RM Max calculation failed, falling back to client logic:',
        err,
      );
      try {
        const result = calculateEpley1RM(weightVal, repsVal);
        setOrmResult(result);
      } catch {
        setError(err instanceof Error ? err.message : 'Calculation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calc-root" data-testid="calculator-page">
      {/* Cinematic Background Orbs */}
      <div className="calc-orbs" aria-hidden>
        <div className="calc-orb-1" />
        <div className="calc-orb-2" />
        <div className="calc-orb-3" />
      </div>

      {/* Navigation */}
      <nav className="calc-nav">
        <button
          className="calc-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={20} /> Dashboard
        </button>
        <div className="calc-nav-title">Fitness Calculators</div>
      </nav>

      <div className="calc-page">
        {/* Header */}
        <div className="calc-header">
          <h1 className="calc-title">GymFuel Calculators</h1>
          <p className="calc-subtitle">
            Optimize your diet, track key bio-metrics, and calculate your target
            lifts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="calc-tabs">
          {[
            {
              id: 'tdee',
              label: '🔥 TDEE & Macros',
              icon: <Flame size={16} />,
            },
            { id: 'bmi', label: '📊 BMI', icon: <Activity size={16} /> },
            {
              id: 'protein',
              label: '🥩 Protein Range',
              icon: <Target size={16} />,
            },
            { id: '1rm', label: '🏋️ 1-Rep Max', icon: <Dumbbell size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`calc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
              data-testid={`tab-${tab.id}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className="calc-tab-indicator"
                  layoutId="activeTabIndicator"
                />
              )}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="calc-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Panels */}
        <div className="calc-panel-container">
          <AnimatePresence mode="wait">
            {activeTab === 'tdee' && (
              <motion.div
                key="tdee"
                className="calc-panel"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="calc-split-layout">
                  {/* Form */}
                  <form onSubmit={handleTDEESubmit} className="calc-form">
                    <h3 className="panel-title">
                      Calculate TDEE & Daily Macros
                    </h3>
                    <div className="calc-form-grid">
                      <div className="input-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={tdeeWeight}
                          onChange={(e) => setTdeeWeight(e.target.value)}
                          placeholder="e.g. 70"
                          data-testid="tdee-weight"
                        />
                      </div>
                      <div className="input-group">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={tdeeHeight}
                          onChange={(e) => setTdeeHeight(e.target.value)}
                          placeholder="e.g. 175"
                          data-testid="tdee-height"
                        />
                      </div>
                      <div className="input-group">
                        <label>Age (years)</label>
                        <input
                          type="number"
                          required
                          value={tdeeAge}
                          onChange={(e) => setTdeeAge(e.target.value)}
                          placeholder="e.g. 25"
                          data-testid="tdee-age"
                        />
                      </div>
                      <div className="input-group">
                        <label>Gender</label>
                        <select
                          value={tdeeGender}
                          onChange={(e) =>
                            setTdeeGender(e.target.value as Gender)
                          }
                          data-testid="tdee-gender"
                        >
                          <option value={Gender.MALE}>Male</option>
                          <option value={Gender.FEMALE}>Female</option>
                          <option value={Gender.OTHER}>Other / Neutral</option>
                        </select>
                      </div>
                      <div className="input-group span-2">
                        <label>Activity Level</label>
                        <select
                          value={tdeeActivity}
                          onChange={(e) =>
                            setTdeeActivity(e.target.value as ActivityLevel)
                          }
                          data-testid="tdee-activity"
                        >
                          <option value={ActivityLevel.SEDENTARY}>
                            Sedentary (Little or no exercise)
                          </option>
                          <option value={ActivityLevel.LIGHT}>
                            Lightly Active (Exercise 1–3 days/week)
                          </option>
                          <option value={ActivityLevel.MODERATE}>
                            Moderately Active (Exercise 3–5 days/week)
                          </option>
                          <option value={ActivityLevel.ACTIVE}>
                            Active (Exercise 6–7 days/week)
                          </option>
                          <option value={ActivityLevel.VERY_ACTIVE}>
                            Very Active (Hard exercise/physical job)
                          </option>
                        </select>
                      </div>
                      <div className="input-group span-2">
                        <label>Fitness Goal</label>
                        <select
                          value={tdeeGoal}
                          onChange={(e) =>
                            setTdeeGoal(e.target.value as FitnessGoal)
                          }
                          data-testid="tdee-goal"
                        >
                          <option value={FitnessGoal.LOSE_WEIGHT}>
                            Lose Weight (Deficit)
                          </option>
                          <option value={FitnessGoal.MAINTAIN_WEIGHT}>
                            Maintain Weight
                          </option>
                          <option value={FitnessGoal.BUILD_MUSCLE}>
                            Build Muscle (Surplus)
                          </option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="calc-submit-btn"
                    >
                      {loading ? 'Calculating...' : 'Calculate targets'}
                    </button>
                  </form>

                  {/* Results */}
                  <div className="calc-results">
                    {tdeeResult ? (
                      <div className="results-wrapper">
                        <div className="results-main">
                          <div className="results-main-title">
                            Estimated TDEE
                          </div>
                          <div
                            className="results-main-val"
                            style={{ color: LIME }}
                          >
                            {tdeeResult.tdee.toLocaleString()}{' '}
                            <span className="unit">kcal</span>
                          </div>
                          <div className="results-main-desc">
                            Your Total Daily Energy Expenditure is the number of
                            calories you burn per day.
                          </div>
                        </div>

                        <div className="targets-section">
                          <h4 className="targets-title">
                            Recommended Daily Targets
                          </h4>
                          <div className="target-goal-calories">
                            <span className="label">Daily Calorie Target:</span>
                            <span className="val" style={{ color: CYAN }}>
                              {tdeeResult.targets.targetCalories.toLocaleString()}{' '}
                              kcal
                            </span>
                          </div>

                          <div className="macros-grid">
                            <div className="macro-box">
                              <span className="macro-label">🥩 Protein</span>
                              <span
                                className="macro-val"
                                style={{ color: LIME }}
                              >
                                {tdeeResult.targets.targetProtein}g
                              </span>
                              <span className="macro-cal">
                                {tdeeResult.targets.targetProtein * 4} kcal
                              </span>
                            </div>
                            <div className="macro-box">
                              <span className="macro-label">🌾 Carbs</span>
                              <span
                                className="macro-val"
                                style={{ color: CYAN }}
                              >
                                {tdeeResult.targets.targetCarbs}g
                              </span>
                              <span className="macro-cal">
                                {tdeeResult.targets.targetCarbs * 4} kcal
                              </span>
                            </div>
                            <div className="macro-box">
                              <span className="macro-label">🥑 Fat</span>
                              <span
                                className="macro-val"
                                style={{ color: ORANGE }}
                              >
                                {tdeeResult.targets.targetFat}g
                              </span>
                              <span className="macro-cal">
                                {tdeeResult.targets.targetFat * 9} kcal
                              </span>
                            </div>
                          </div>

                          <div className="water-box">
                            <span className="water-label">
                              💧 Recommended Hydration
                            </span>
                            <span className="water-val" style={{ color: CYAN }}>
                              {tdeeResult.targets.targetWaterGlasses} glasses (
                              {tdeeResult.targets.targetWaterGlasses * 0.25}L)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="results-empty">
                        <Sparkles size={32} style={{ color: LIME }} />
                        <p>
                          Fill out the form and click Calculate to view your
                          TDEE and nutritional breakdown.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bmi' && (
              <motion.div
                key="bmi"
                className="calc-panel"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="calc-split-layout">
                  {/* Form */}
                  <form onSubmit={handleBMISubmit} className="calc-form">
                    <h3 className="panel-title">Body Mass Index (BMI)</h3>
                    <div className="calc-form-grid">
                      <div className="input-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={bmiWeight}
                          onChange={(e) => setBmiWeight(e.target.value)}
                          placeholder="e.g. 70"
                          data-testid="bmi-weight"
                        />
                      </div>
                      <div className="input-group">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={bmiHeight}
                          onChange={(e) => setBmiHeight(e.target.value)}
                          placeholder="e.g. 175"
                          data-testid="bmi-height"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="calc-submit-btn"
                    >
                      {loading ? 'Calculating...' : 'Calculate BMI'}
                    </button>
                  </form>

                  {/* Results */}
                  <div className="calc-results">
                    {bmiResult ? (
                      <div className="results-wrapper">
                        <div className="results-main">
                          <div className="results-main-title">
                            Your BMI Score
                          </div>
                          <div
                            className="results-main-val"
                            style={{ color: CYAN }}
                          >
                            {bmiResult.bmi}
                          </div>
                          <div
                            className={`results-classification ${bmiResult.classification.toLowerCase()}`}
                            style={{
                              color:
                                bmiResult.classification === 'Normal'
                                  ? LIME
                                  : bmiResult.classification === 'Underweight'
                                    ? CYAN
                                    : bmiResult.classification === 'Overweight'
                                      ? ORANGE
                                      : '#EF4444',
                            }}
                          >
                            Classification: {bmiResult.classification}
                          </div>
                        </div>

                        {/* BMI Slider Gauge */}
                        <div className="bmi-gauge">
                          <div className="gauge-track">
                            <div className="gauge-section underweight">
                              Under
                            </div>
                            <div className="gauge-section normal">Normal</div>
                            <div className="gauge-section overweight">Over</div>
                            <div className="gauge-section obese">Obese</div>
                            <div
                              className="gauge-pointer"
                              style={{
                                left: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    ((bmiResult.bmi - 15) / (35 - 15)) * 100,
                                  ),
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="gauge-labels">
                            <span>15.0</span>
                            <span>18.5</span>
                            <span>25.0</span>
                            <span>30.0</span>
                            <span>35.0</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="results-empty">
                        <Activity size={32} style={{ color: CYAN }} />
                        <p>
                          Fill out the form and click Calculate to view your BMI
                          score and health classification.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'protein' && (
              <motion.div
                key="protein"
                className="calc-panel"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="calc-split-layout">
                  {/* Form */}
                  <form onSubmit={handleProteinSubmit} className="calc-form">
                    <h3 className="panel-title">Daily Protein Intake Target</h3>
                    <div className="calc-form-grid">
                      <div className="input-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={proteinWeight}
                          onChange={(e) => setProteinWeight(e.target.value)}
                          placeholder="e.g. 70"
                          data-testid="protein-weight"
                        />
                      </div>
                      <div className="input-group">
                        <label>Fitness Goal</label>
                        <select
                          value={proteinGoal}
                          onChange={(e) =>
                            setProteinGoal(e.target.value as FitnessGoal)
                          }
                          data-testid="protein-goal"
                        >
                          <option value={FitnessGoal.LOSE_WEIGHT}>
                            Lose Weight (Fat Loss)
                          </option>
                          <option value={FitnessGoal.MAINTAIN_WEIGHT}>
                            General Health / Maintain
                          </option>
                          <option value={FitnessGoal.BUILD_MUSCLE}>
                            Build Muscle / Strength
                          </option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="calc-submit-btn"
                    >
                      {loading ? 'Calculating...' : 'Calculate Protein'}
                    </button>
                  </form>

                  {/* Results */}
                  <div className="calc-results">
                    {proteinResult ? (
                      <div className="results-wrapper">
                        <div className="results-main">
                          <div className="results-main-title">
                            Recommended Protein Range
                          </div>
                          <div
                            className="results-main-val"
                            style={{ color: PURPLE }}
                          >
                            {proteinResult.min}g - {proteinResult.max}g
                          </div>
                          <div
                            className="results-main-desc"
                            style={{ marginTop: '1.25rem' }}
                          >
                            We recommend aiming for this range daily. Protein
                            supports muscle recovery, metabolism, and satiety.
                          </div>
                        </div>

                        <div className="tip-box">
                          <strong>💡 Pro Tip:</strong>
                          <p>
                            Spacing your protein out into 3–4 meals of 30g–50g
                            is optimal for muscle protein synthesis.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="results-empty">
                        <Target size={32} style={{ color: PURPLE }} />
                        <p>
                          Enter your stats to find your recommended daily
                          protein intake range.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === '1rm' && (
              <motion.div
                key="1rm"
                className="calc-panel"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="calc-split-layout">
                  {/* Form */}
                  <form onSubmit={handleORMSubmit} className="calc-form">
                    <h3 className="panel-title">
                      1-Repetition Max (1RM) Estimator
                    </h3>
                    <div className="calc-form-grid">
                      <div className="input-group">
                        <label>Weight Lifted (kg / lbs)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={ormWeight}
                          onChange={(e) => setOrmWeight(e.target.value)}
                          placeholder="e.g. 100"
                          data-testid="orm-weight"
                        />
                      </div>
                      <div className="input-group">
                        <label>Repetitions Completed</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="30"
                          value={ormReps}
                          onChange={(e) => setOrmReps(e.target.value)}
                          placeholder="e.g. 5"
                          data-testid="orm-reps"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="calc-submit-btn"
                    >
                      {loading ? 'Estimating...' : 'Estimate 1-Rep Max'}
                    </button>
                  </form>

                  {/* Results */}
                  <div className="calc-results">
                    {ormResult ? (
                      <div className="results-wrapper">
                        <div className="results-main">
                          <div className="results-main-title">
                            Estimated 1-Rep Max
                          </div>
                          <div
                            className="results-main-val"
                            style={{ color: ORANGE }}
                          >
                            {ormResult.oneRepMax}{' '}
                            <span className="unit">kg/lbs</span>
                          </div>
                          <div className="results-main-desc">
                            Calculated using the Epley formula:{' '}
                            <code>Weight × (1 + Reps/30)</code>.
                          </div>
                        </div>

                        {/* Rep Table */}
                        <div className="rep-table-section">
                          <h4 className="table-title">
                            Estimated Repetition Percentages
                          </h4>
                          <table className="rep-table">
                            <thead>
                              <tr>
                                <th>Percentage</th>
                                <th>Target Weight</th>
                                <th>Est. Reps</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { pct: 100, reps: 1 },
                                { pct: 95, reps: 2 },
                                { pct: 90, reps: 4 },
                                { pct: 85, reps: 6 },
                                { pct: 80, reps: 8 },
                                { pct: 75, reps: 10 },
                                { pct: 70, reps: 12 },
                              ].map((row) => (
                                <tr key={row.pct}>
                                  <td>{row.pct}%</td>
                                  <td>
                                    {Math.round(
                                      ormResult.oneRepMax * (row.pct / 100),
                                    )}{' '}
                                    kg/lbs
                                  </td>
                                  <td>{row.reps}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="results-empty">
                        <Dumbbell size={32} style={{ color: ORANGE }} />
                        <p>
                          Input your working weight and reps to estimate your
                          absolute strength (1-Rep Max).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
