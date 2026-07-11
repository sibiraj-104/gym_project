import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gender,
  ActivityLevel,
  FitnessGoal,
  calculateTDEE,
  calculateMacroTargets,
} from 'gymfuel-shared';
import { useAuthStore } from '../store/authStore';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Scale,
  Ruler,
  AlertCircle,
  Flame,
  CheckCircle,
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unit toggles
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Input states
  const [age, setAge] = useState<string>('25');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    ActivityLevel.MODERATE,
  );
  const [goal, setGoal] = useState<FitnessGoal>(FitnessGoal.BUILD_MUSCLE);

  // Numeric unit inputs
  const [weightVal, setWeightVal] = useState<string>('70'); // displayed value
  const [heightCm, setHeightCm] = useState<string>('175'); // displayed cm
  const [heightFt, setHeightFt] = useState<string>('5'); // displayed ft
  const [heightIn, setHeightIn] = useState<string>('9'); // displayed in

  // Get metric values for storage/API
  const getMetricWeight = (): number => {
    const val = parseFloat(weightVal);
    if (isNaN(val)) return 0;
    return weightUnit === 'lbs' ? Math.round((val / 2.20462) * 10) / 10 : val;
  };

  const getMetricHeight = (): number => {
    if (heightUnit === 'cm') {
      const val = parseFloat(heightCm);
      return isNaN(val) ? 0 : val;
    } else {
      const ft = parseFloat(heightFt);
      const inch = parseFloat(heightIn);
      const totalInches = (isNaN(ft) ? 0 : ft) * 12 + (isNaN(inch) ? 0 : inch);
      return Math.round(totalInches * 2.54 * 10) / 10;
    }
  };

  // Convert values when toggling weight units
  const handleWeightUnitToggle = (unit: 'kg' | 'lbs') => {
    if (unit === weightUnit) return;
    const currentVal = parseFloat(weightVal);
    if (!isNaN(currentVal)) {
      if (unit === 'lbs') {
        setWeightVal((Math.round(currentVal * 2.20462 * 10) / 10).toString());
      } else {
        setWeightVal((Math.round((currentVal / 2.20462) * 10) / 10).toString());
      }
    }
    setWeightUnit(unit);
  };

  // Convert values when toggling height units
  const handleHeightUnitToggle = (unit: 'cm' | 'ft') => {
    if (unit === heightUnit) return;
    if (unit === 'ft') {
      const cm = parseFloat(heightCm);
      if (!isNaN(cm)) {
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setHeightFt(ft.toString());
        setHeightIn(inch.toString());
      }
    } else {
      const ft = parseFloat(heightFt);
      const inch = parseFloat(heightIn);
      const totalInches = (isNaN(ft) ? 0 : ft) * 12 + (isNaN(inch) ? 0 : inch);
      setHeightCm((Math.round(totalInches * 2.54 * 10) / 10).toString());
    }
    setHeightUnit(unit);
  };

  // Live calculations (for Preview Step 3)
  const metricWeight = getMetricWeight();
  const metricHeight = getMetricHeight();
  const numAge = parseInt(age) || 0;

  const liveTdee = calculateTDEE(
    metricWeight,
    metricHeight,
    numAge,
    gender,
    activityLevel,
  );

  const liveMacros = calculateMacroTargets(liveTdee, metricWeight, goal);

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (
        !age ||
        isNaN(parseInt(age)) ||
        parseInt(age) < 10 ||
        parseInt(age) > 120
      ) {
        setError('Please enter a valid age between 10 and 120.');
        return false;
      }
      const w = parseFloat(weightVal);
      if (isNaN(w) || w <= 0) {
        setError('Please enter a valid weight.');
        return false;
      }
      if (weightUnit === 'kg' && (w < 20 || w > 500)) {
        setError('Weight must be between 20 kg and 500 kg.');
        return false;
      }
      if (weightUnit === 'lbs' && (w < 44 || w > 1100)) {
        setError('Weight must be between 44 lbs and 1100 lbs.');
        return false;
      }

      if (heightUnit === 'cm') {
        const h = parseFloat(heightCm);
        if (isNaN(h) || h < 50 || h > 300) {
          setError('Height must be between 50 cm and 300 cm.');
          return false;
        }
      } else {
        const ft = parseFloat(heightFt);
        const inch = parseFloat(heightIn);
        if (
          isNaN(ft) ||
          ft < 2 ||
          ft > 9 ||
          isNaN(inch) ||
          inch < 0 ||
          inch >= 12
        ) {
          setError('Please enter a valid height in feet and inches.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      age: numAge,
      weight: metricWeight,
      height: metricHeight,
      gender,
      activityLevel,
      goal,
    };

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error?.message || 'Failed to submit onboarding data.',
        );
      }

      // Re-fetch profile in authStore to sync state
      await fetchProfile();
      navigate('/dashboard');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Submission failed.';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityOptions = [
    {
      level: ActivityLevel.SEDENTARY,
      title: 'Sedentary',
      desc: 'Little to no daily physical activity or exercise (desk job).',
    },
    {
      level: ActivityLevel.LIGHT,
      title: 'Lightly Active',
      desc: 'Light daily exercise or training 1–3 times a week.',
    },
    {
      level: ActivityLevel.MODERATE,
      title: 'Moderately Active',
      desc: 'Moderate daily exercise or training 3–5 times a week.',
    },
    {
      level: ActivityLevel.ACTIVE,
      title: 'Active',
      desc: 'Intense exercise or sports 6–7 times a week.',
    },
    {
      level: ActivityLevel.VERY_ACTIVE,
      title: 'Very Active',
      desc: 'Hard exercise daily, plus a physical job or twice-a-day training.',
    },
  ];

  const goalOptions = [
    {
      type: FitnessGoal.LOSE_WEIGHT,
      title: 'Lose Weight',
      desc: 'Burn fat and trim down using a controlled calorie deficit.',
    },
    {
      type: FitnessGoal.BUILD_MUSCLE,
      title: 'Build Muscle',
      desc: 'Promote hypertrophy and strength using a clean calorie surplus.',
    },
    {
      type: FitnessGoal.MAINTAIN_WEIGHT,
      title: 'Maintain Weight',
      desc: 'Maintain body composition and optimize daily energy levels.',
    },
    {
      type: FitnessGoal.IMPROVE_ENDURANCE,
      title: 'Improve Endurance',
      desc: 'Build stamina and aerobic capacity for long-duration workouts.',
    },
    {
      type: FitnessGoal.INCREASE_STRENGTH,
      title: 'Increase Strength',
      desc: 'Focus on neuromuscular efficiency and lifting heavier weights.',
    },
  ];

  return (
    <div
      data-testid="onboarding-page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        backgroundImage:
          'radial-gradient(circle at 5% 50%, rgba(0, 255, 136, 0.03) 0%, transparent 40%), radial-gradient(circle at 95% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 40%)',
        color: '#ffffff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Step Progress Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor:
                    step === s
                      ? '#00ff88'
                      : step > s
                        ? 'rgba(0, 255, 136, 0.2)'
                        : '#16161a',
                  border:
                    step === s
                      ? '1px solid #00ff88'
                      : step > s
                        ? '1px solid rgba(0, 255, 136, 0.3)'
                        : '1px solid #27272a',
                  color:
                    step === s ? '#09090b' : step > s ? '#00ff88' : '#71717a',
                  transition: 'all 0.3s ease',
                }}
              >
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
            ))}
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {step === 1 && 'Let’s configure your body stats'}
            {step === 2 && 'Tell us about your active level'}
            {step === 3 && 'Select your fitness goal'}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>
            {step === 1 &&
              'Step 1 of 3: We use these metrics to calculate your baseline metabolic rate.'}
            {step === 2 &&
              'Step 2 of 3: Multiplies BMR by daily energy output factors.'}
            {step === 3 &&
              'Step 3 of 3: Select your target to view calorie and macronutrient split goals.'}
          </p>
        </div>

        {/* Global Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Step Body */}
        <div
          style={{
            backgroundColor: '#16161a',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box',
            marginBottom: '2rem',
            minHeight: '340px',
          }}
        >
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Age & Gender Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#a1a1aa',
                      }}
                    >
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.75rem',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#a1a1aa',
                      }}
                    >
                      Biological Gender
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[Gender.MALE, Gender.FEMALE].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          style={{
                            flex: 1,
                            backgroundColor:
                              gender === g
                                ? 'rgba(0, 255, 136, 0.08)'
                                : 'transparent',
                            border:
                              gender === g
                                ? '1px solid #00ff88'
                                : '1px solid #27272a',
                            borderRadius: '8px',
                            color: gender === g ? '#00ff88' : '#e4e4e7',
                            padding: '0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {g === Gender.MALE ? 'Male' : 'Female'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weight Input with toggle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#a1a1aa',
                      }}
                    >
                      Weight
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '0.2rem',
                      }}
                    >
                      {['kg', 'lbs'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() =>
                            handleWeightUnitToggle(u as 'kg' | 'lbs')
                          }
                          style={{
                            border: 'none',
                            backgroundColor:
                              weightUnit === u ? '#27272a' : 'transparent',
                            borderRadius: '4px',
                            color: weightUnit === u ? '#00ff88' : '#71717a',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Scale
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#71717a',
                      }}
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder={`Weight in ${weightUnit}`}
                      value={weightVal}
                      onChange={(e) => setWeightVal(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.75rem 1rem 0.75rem 2.75rem',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Height Input with toggle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#a1a1aa',
                      }}
                    >
                      Height
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '0.2rem',
                      }}
                    >
                      {['cm', 'ft'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() =>
                            handleHeightUnitToggle(u as 'cm' | 'ft')
                          }
                          style={{
                            border: 'none',
                            backgroundColor:
                              heightUnit === u ? '#27272a' : 'transparent',
                            borderRadius: '4px',
                            color: heightUnit === u ? '#00ff88' : '#71717a',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {heightUnit === 'cm' ? (
                    <div style={{ position: 'relative' }}>
                      <Ruler
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#71717a',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Height in cm"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '0.75rem 1rem 0.75rem 2.75rem',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          placeholder="ft"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#71717a',
                            fontSize: '0.85rem',
                          }}
                        >
                          ft
                        </span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          placeholder="in"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#71717a',
                            fontSize: '0.85rem',
                          }}
                        >
                          in
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {activityOptions.map((opt) => (
                  <div
                    key={opt.level}
                    onClick={() => setActivityLevel(opt.level)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      backgroundColor:
                        activityLevel === opt.level
                          ? 'rgba(0, 255, 136, 0.05)'
                          : 'rgba(0,0,0,0.15)',
                      border:
                        activityLevel === opt.level
                          ? '1px solid #00ff88'
                          : '1px solid #27272a',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border:
                          activityLevel === opt.level
                            ? '5px solid #00ff88'
                            : '2px solid #52525b',
                        backgroundColor: '#16161a',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    />
                    <div>
                      <h4
                        style={{
                          margin: '0 0 0.25rem 0',
                          fontWeight: 700,
                          color:
                            activityLevel === opt.level ? '#00ff88' : '#ffffff',
                        }}
                      >
                        {opt.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8rem',
                          color: '#a1a1aa',
                          lineHeight: '1.4',
                        }}
                      >
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: '2rem',
                }}
              >
                {/* Left side: Goals selectors */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {goalOptions.map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => setGoal(opt.type)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor:
                          goal === opt.type
                            ? 'rgba(0, 255, 136, 0.05)'
                            : 'rgba(0,0,0,0.15)',
                        border:
                          goal === opt.type
                            ? '1px solid #00ff88'
                            : '1px solid #27272a',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: goal === opt.type ? '#00ff88' : '#ffffff',
                        }}
                      >
                        {opt.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#a1a1aa',
                          marginTop: '0.25rem',
                        }}
                      >
                        {opt.desc}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right side: Realtime Target Calculations Preview */}
                <div
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#00ff88',
                      borderBottom: '1px solid #27272a',
                      paddingBottom: '0.75rem',
                    }}
                  >
                    <Sparkles size={18} />
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Target Estimates
                    </span>
                  </div>

                  {/* Calculations breakdown */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: '#a1a1aa' }}>BMR (Baseline):</span>
                    <span style={{ fontWeight: 600 }}>
                      {Math.round(
                        liveTdee /
                          (activityLevel === ActivityLevel.SEDENTARY
                            ? 1.2
                            : activityLevel === ActivityLevel.LIGHT
                              ? 1.375
                              : activityLevel === ActivityLevel.MODERATE
                                ? 1.55
                                : activityLevel === ActivityLevel.ACTIVE
                                  ? 1.725
                                  : 1.9),
                      )}{' '}
                      kcal
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: '#a1a1aa' }}>TDEE (Daily Burn):</span>
                    <span style={{ fontWeight: 600 }}>{liveTdee} kcal</span>
                  </div>

                  {/* Target Calories box */}
                  <div
                    style={{
                      backgroundColor: 'rgba(0, 255, 136, 0.08)',
                      border: '1px solid rgba(0, 255, 136, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#00ff88',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Flame size={14} /> Recommended Calories
                    </div>
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0.25rem 0',
                      }}
                    >
                      {liveMacros.targetCalories}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                      kcal / day
                    </div>
                  </div>

                  {/* Macro splits layout */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px dotted #27272a',
                        paddingBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: '#a1a1aa' }}>Protein target:</span>
                      <span style={{ fontWeight: 700, color: '#00ff88' }}>
                        {liveMacros.targetProtein}g
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px dotted #27272a',
                        paddingBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: '#a1a1aa' }}>Carbohydrates:</span>
                      <span style={{ fontWeight: 700, color: '#00d4ff' }}>
                        {liveMacros.targetCarbs}g
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px dotted #27272a',
                        paddingBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: '#a1a1aa' }}>Fats target:</span>
                      <span style={{ fontWeight: 700, color: '#facc15' }}>
                        {liveMacros.targetFat}g
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.25rem',
                      }}
                    >
                      <span style={{ color: '#a1a1aa' }}>Hydration goal:</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {liveMacros.targetWaterGlasses} glasses
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Wizard Controls Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#e4e4e7',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              data-testid="next-btn"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = '#00ff88')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = '#3f3f46')
              }
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              data-testid="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#00ff88',
                border: 'none',
                borderRadius: '8px',
                color: '#09090b',
                padding: '0.75rem 2rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(0, 255, 136, 0.25)',
              }}
            >
              {isSubmitting ? (
                'Finalizing...'
              ) : (
                <>
                  Complete Setup <Sparkles size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
