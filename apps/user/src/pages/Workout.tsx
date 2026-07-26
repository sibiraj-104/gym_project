import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { workoutApi } from '../api/workoutApi';
import {
  IExercise,
  IWorkoutLog,
  IWorkoutTemplate,
  MuscleGroup,
  Equipment,
} from 'gymfuel-shared';
import {
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import './Workout.css';

type TabType = 'session' | 'library' | 'templates' | 'history';

// Accent Colors
const PURPLE = '#A855F7';
const LIME = '#C8FF00';
const CYAN = '#00E5FF';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const {
    activeWorkout,
    loading: storeLoading,
    error: storeError,
    startWorkout,
    cancelWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    finishWorkout,
  } = useWorkoutStore();

  const [activeTab, setActiveTab] = useState<TabType>('session');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active workout timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active workout notes
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Exercise Library state
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [libSearch, setLibSearch] = useState('');
  const [libMuscle, setLibMuscle] = useState('');
  const [libEquipment, setLibEquipment] = useState('');
  const [libPage, setLibPage] = useState(1);
  const [libTotalPages, setLibTotalPages] = useState(1);
  const [libLoading, setLibLoading] = useState(false);

  // Exercise Details Modal
  const [selectedExercise, setSelectedExercise] = useState<IExercise | null>(
    null,
  );

  // Templates state
  const [templates, setTemplates] = useState<IWorkoutTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<IWorkoutLog[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(
    null,
  );

  // Search/selector modal inside active session
  const [showAddExModal, setShowAddExModal] = useState(false);

  // Auto-redirect to active tab if workout is started
  useEffect(() => {
    if (activeWorkout.isActive) {
      setActiveTab('session');
    }
  }, [activeWorkout.isActive]);

  // Handle active workout timer
  useEffect(() => {
    if (activeWorkout.isActive && activeWorkout.startedAt) {
      const start = new Date(activeWorkout.startedAt).getTime();

      // Clear any existing interval
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const diff = Math.floor((Date.now() - start) / 1000);
        setSecondsElapsed(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSecondsElapsed(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout.isActive, activeWorkout.startedAt]);

  // Load Exercise Library
  const fetchLibrary = async () => {
    setLibLoading(true);
    setError(null);
    try {
      const res = await workoutApi.getExercises({
        search: libSearch,
        muscle: libMuscle,
        equipment: libEquipment,
        page: libPage,
        limit: 12,
      });
      setExercises(res.exercises);
      setLibTotalPages(res.pagination.pages);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load exercises.',
      );
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library' || showAddExModal) {
      fetchLibrary();
    }
  }, [activeTab, libSearch, libMuscle, libEquipment, libPage, showAddExModal]);

  // Load Templates
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    setError(null);
    try {
      const res = await workoutApi.getWorkoutTemplates();
      setTemplates(res.templates);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load templates.',
      );
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Load History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await workoutApi.getWorkoutHistory(historyPage, 10);
      setHistory(res.history);
      setHistoryTotalPages(res.pagination.pages);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load workout history.',
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyPage]);

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Start empty workout
  const handleStartEmpty = () => {
    startWorkout('My Workout');
    setWorkoutNotes('');
  };

  // Start workout from a template
  const handleStartTemplate = (template: IWorkoutTemplate) => {
    const initialExercises = template.exercises.map((te) => {
      // Setup base sets for the workout log matching sets count in template
      const sets = Array.from({ length: te.sets }).map((_, idx) => ({
        setNumber: idx + 1,
        reps: parseInt(te.repsRange.split('-')[0]) || 10,
        weight: 0,
        isWarmup: false,
        restSeconds: te.restSeconds || 90,
      }));

      return {
        exerciseId: String(te.exerciseId),
        exerciseName: te.exerciseName,
        sets,
        notes: te.notes || '',
      };
    });

    startWorkout(template.name, initialExercises);
    setWorkoutNotes(template.description);
  };

  // Submit active workout
  const handleFinish = async () => {
    if (activeWorkout.exercises.length === 0) {
      setError('Please add at least one exercise to complete your workout.');
      return;
    }

    try {
      const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));
      // Estimate calories burned as ~6 kcal per minute as standard estimate
      const caloriesBurned = durationMinutes * 6;

      const log = await finishWorkout(
        durationMinutes,
        workoutNotes,
        caloriesBurned,
      );
      setSuccessMsg(`Outstanding! "${log.name}" has been logged successfully.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setActiveTab('history');
      setHistoryPage(1);
    } catch {
      // Zustand store sets error state
    }
  };

  return (
    <div className="workout-root" data-testid="workout-page">
      {/* Background Orbs */}
      <div className="workout-orbs" aria-hidden>
        <div className="workout-orb-1" />
        <div className="workout-orb-2" />
      </div>

      {/* Top Header */}
      <nav className="workout-nav">
        <div
          className="workout-nav-brand"
          onClick={() => navigate('/dashboard')}
        >
          <div className="workout-nav-logo">🏋️</div>
          <span className="workout-nav-title">GymFuel Tracker</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
      </nav>

      <div className="workout-page">
        {/* Alerts / Error Messages */}
        <AnimatePresence>
          {(error || storeError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {error || storeError}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                backgroundColor: 'rgba(200, 255, 0, 0.08)',
                border: '1px solid rgba(200, 255, 0, 0.25)',
                color: LIME,
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              🎉 {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Selection */}
        <div className="workout-tabs">
          <button
            className={`workout-tab-btn ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
          >
            💪 {activeWorkout.isActive ? 'Active Session' : 'New Workout'}
          </button>
          <button
            className={`workout-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('library');
              setLibPage(1);
            }}
          >
            📖 Movement Library
          </button>
          <button
            className={`workout-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            📋 Routine Templates
          </button>
          <button
            className={`workout-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              setHistoryPage(1);
            }}
          >
            📅 Log History
          </button>
        </div>

        {/* ── Tab View Render ─────────────────────────────────────────── */}
        <div className="workout-tab-content">
          {/* TAB 1: ACTIVE WORKOUT SESSION */}
          {activeTab === 'session' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {!activeWorkout.isActive ? (
                /* Empty state setup */
                <div className="workout-card empty-session-container">
                  <div className="empty-session-icon">🏋️</div>
                  <h2>Ready to crush a session?</h2>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      maxWidth: '420px',
                      margin: '0.5rem auto 1.5rem',
                    }}
                  >
                    Start a completely blank workout log, or switch over to the
                    **Routine Templates** tab to load a structured workout
                    program.
                  </p>
                  <button
                    className="start-session-btn"
                    onClick={handleStartEmpty}
                  >
                    Start Empty Workout ⚡
                  </button>
                </div>
              ) : (
                /* Active workout tracker UI */
                <div className="workout-card">
                  <div className="session-header">
                    <div>
                      <input
                        type="text"
                        className="session-title-input"
                        value={activeWorkout.name}
                        onChange={(e) =>
                          useWorkoutStore.setState((state) => ({
                            activeWorkout: {
                              ...state.activeWorkout,
                              name: e.target.value,
                            },
                          }))
                        }
                        title="Workout Name"
                      />
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.35)',
                          marginTop: '4px',
                        }}
                      >
                        Start time:{' '}
                        {new Date(activeWorkout.startedAt!).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' },
                        )}
                      </div>
                    </div>
                    <div className="timer-container">
                      <Clock size={18} />
                      <span>{formatTime(secondsElapsed)}</span>
                    </div>
                  </div>

                  {/* Optional notes */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <textarea
                      placeholder="Add workout notes or routine description..."
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '0.65rem',
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: '0.85rem',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '60px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Exercises list */}
                  {activeWorkout.exercises.length === 0 ? (
                    <div
                      style={{
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>💡</span>
                      <div style={{ fontWeight: 700 }}>
                        No movements added yet
                      </div>
                      <p
                        style={{
                          color: 'rgba(255,255,255,0.35)',
                          fontSize: '0.8rem',
                          margin: 0,
                        }}
                      >
                        Click the button below to browse and add exercises to
                        this workout.
                      </p>
                    </div>
                  ) : (
                    activeWorkout.exercises.map((ex) => (
                      <div className="active-exercise-card" key={ex.exerciseId}>
                        <div className="exercise-card-header">
                          <h4 className="exercise-card-title">
                            {ex.exerciseName}
                          </h4>
                          <button
                            className="remove-ex-btn"
                            onClick={() => removeExercise(ex.exerciseId)}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="sets-table">
                            <thead>
                              <tr>
                                <th>Set</th>
                                <th>Warmup</th>
                                <th>Weight (kg)</th>
                                <th>Reps</th>
                                <th>RPE</th>
                                <th>Rest (s)</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {ex.sets.map((set, setIdx) => (
                                <tr
                                  key={setIdx}
                                  className={`set-row ${set.isWarmup ? 'warmup' : ''}`}
                                >
                                  <td>
                                    <span className="set-num-label">
                                      {set.setNumber}
                                    </span>
                                  </td>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="set-checkbox"
                                      checked={set.isWarmup}
                                      onChange={(e) =>
                                        updateSet(ex.exerciseId, setIdx, {
                                          isWarmup: e.target.checked,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="set-input"
                                      value={set.weight ?? ''}
                                      placeholder="0"
                                      onChange={(e) =>
                                        updateSet(ex.exerciseId, setIdx, {
                                          weight:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="set-input"
                                      value={set.reps ?? ''}
                                      placeholder="0"
                                      onChange={(e) =>
                                        updateSet(ex.exerciseId, setIdx, {
                                          reps: parseInt(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="set-input"
                                      min="1"
                                      max="10"
                                      value={set.rpe ?? ''}
                                      placeholder="-"
                                      onChange={(e) =>
                                        updateSet(ex.exerciseId, setIdx, {
                                          rpe:
                                            parseInt(e.target.value) ||
                                            undefined,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="set-input"
                                      value={set.restSeconds ?? ''}
                                      placeholder="90"
                                      onChange={(e) =>
                                        updateSet(ex.exerciseId, setIdx, {
                                          restSeconds:
                                            parseInt(e.target.value) ||
                                            undefined,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <button
                                      className="delete-set-btn"
                                      onClick={() =>
                                        removeSet(ex.exerciseId, setIdx)
                                      }
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button
                          className="add-set-row-btn"
                          onClick={() => addSet(ex.exerciseId)}
                        >
                          <Plus size={12} /> Add Set
                        </button>
                      </div>
                    ))
                  )}

                  {/* Add Exercise Trigger */}
                  <button
                    onClick={() => setShowAddExModal(true)}
                    style={{
                      width: '100%',
                      background: 'rgba(168, 85, 247, 0.05)',
                      border: '1px dashed rgba(168, 85, 247, 0.25)',
                      borderRadius: '16px',
                      color: '#c084fc',
                      padding: '0.85rem',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '1.5rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={16} /> Add Exercise
                  </button>

                  {/* Action buttons */}
                  <div className="session-actions">
                    <button
                      className="finish-session-btn"
                      onClick={handleFinish}
                      disabled={storeLoading}
                    >
                      {storeLoading ? 'Logging...' : 'Finish Workout 🏆'}
                    </button>
                    <button
                      className="cancel-session-btn"
                      onClick={cancelWorkout}
                    >
                      Cancel Session
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: EXERCISE LIBRARY */}
          {activeTab === 'library' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="workout-card">
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                  }}
                >
                  Exercise Library
                </h3>

                {/* Filters */}
                <div className="library-search-bar">
                  <input
                    type="text"
                    className="library-search-input"
                    placeholder="Search exercise by name..."
                    value={libSearch}
                    onChange={(e) => {
                      setLibSearch(e.target.value);
                      setLibPage(1);
                    }}
                  />
                </div>

                <div className="library-filters">
                  <select
                    className="library-select"
                    value={libMuscle}
                    onChange={(e) => {
                      setLibMuscle(e.target.value);
                      setLibPage(1);
                    }}
                  >
                    <option value="">All Muscles</option>
                    {Object.values(MuscleGroup).map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>

                  <select
                    className="library-select"
                    value={libEquipment}
                    onChange={(e) => {
                      setLibEquipment(e.target.value);
                      setLibPage(1);
                    }}
                  >
                    <option value="">All Equipment</option>
                    {Object.values(Equipment).map((eq) => (
                      <option key={eq} value={eq}>
                        {eq.toUpperCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exercises list grid */}
                {libLoading ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Loading exercises...
                  </div>
                ) : exercises.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    No exercises match your search filters.
                  </div>
                ) : (
                  <>
                    <div className="exercise-grid">
                      {exercises.map((ex) => (
                        <div
                          className="exercise-item-card"
                          key={ex._id}
                          onClick={() => setSelectedExercise(ex)}
                        >
                          <div>
                            <h4 className="exercise-item-name">{ex.name}</h4>
                            <div className="exercise-meta-tags">
                              <span
                                className="exercise-meta-tag"
                                style={{
                                  color: LIME,
                                  backgroundColor: `${LIME}14`,
                                }}
                              >
                                {ex.muscleGroup}
                              </span>
                              <span
                                className="exercise-meta-tag"
                                style={{
                                  color: CYAN,
                                  backgroundColor: `${CYAN}14`,
                                }}
                              >
                                {ex.equipment}
                              </span>
                            </div>
                          </div>

                          {activeWorkout.isActive ? (
                            <button
                              className="add-ex-to-log-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                addExercise(ex._id, ex.name);
                                setSuccessMsg(
                                  `"${ex.name}" added to active workout!`,
                                );
                                setTimeout(() => setSuccessMsg(null), 2500);
                              }}
                            >
                              Add to Workout
                            </button>
                          ) : (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'rgba(255,255,255,0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Info size={12} /> Click to view details
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {libTotalPages > 1 && (
                      <div className="pagination-row">
                        <button
                          className="page-btn"
                          disabled={libPage === 1}
                          onClick={() => setLibPage(libPage - 1)}
                        >
                          Previous
                        </button>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          Page {libPage} of {libTotalPages}
                        </span>
                        <button
                          className="page-btn"
                          disabled={libPage === libTotalPages}
                          onClick={() => setLibPage(libPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: ROUTINE TEMPLATES */}
          {activeTab === 'templates' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="workout-card">
                <h3
                  style={{
                    margin: '0 0 1.25rem',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                  }}
                >
                  Routine Templates
                </h3>

                {templatesLoading ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    No published routines available.
                  </div>
                ) : (
                  <div className="template-grid">
                    {templates.map((temp) => (
                      <div className="template-item-card" key={temp._id}>
                        <div>
                          <h4 className="template-title">{temp.name}</h4>
                          <p className="template-desc">{temp.description}</p>
                          <div style={{ margin: '1rem 0' }}>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.3)',
                                fontWeight: 800,
                                marginBottom: '6px',
                              }}
                            >
                              Exercises included:
                            </div>
                            {temp.exercises.map((te, idx) => (
                              <div className="template-exercise-item" key={idx}>
                                <span>• {te.exerciseName}</span>
                                <span
                                  style={{ color: 'rgba(255,255,255,0.35)' }}
                                >
                                  {te.sets} sets × {te.repsRange}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          className="start-template-btn"
                          onClick={() => handleStartTemplate(temp)}
                        >
                          Start Routine ⚡
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: WORKOUT LOG HISTORY */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="workout-card">
                <h3
                  style={{
                    margin: '0 0 1.25rem',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                  }}
                >
                  Workout Logs History
                </h3>

                {historyLoading ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem 0',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    You have not logged any workouts yet. Time to hit the gym!
                  </div>
                ) : (
                  <>
                    <div>
                      {history.map((log) => {
                        const isExpanded = expandedHistoryId === log._id;
                        return (
                          <div className="history-item-card" key={log._id}>
                            {/* Expandable header */}
                            <div
                              className="history-item-header"
                              onClick={() =>
                                setExpandedHistoryId(
                                  isExpanded ? null : log._id,
                                )
                              }
                            >
                              <div className="history-title-date">
                                <h4 className="history-name">{log.name}</h4>
                                <div className="history-date">
                                  <Calendar
                                    size={12}
                                    style={{
                                      display: 'inline',
                                      marginRight: '4px',
                                      verticalAlign: 'middle',
                                    }}
                                  />
                                  {new Date(log.startedAt).toLocaleDateString(
                                    [],
                                    {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    },
                                  )}
                                </div>
                              </div>
                              <div className="history-quick-stats">
                                <div className="history-stat">
                                  <span className="history-stat-label">
                                    Duration
                                  </span>
                                  <span
                                    className="history-stat-val"
                                    style={{ color: CYAN }}
                                  >
                                    {log.durationMinutes}m
                                  </span>
                                </div>
                                <div className="history-stat">
                                  <span className="history-stat-label">
                                    Volume
                                  </span>
                                  <span
                                    className="history-stat-val"
                                    style={{ color: LIME }}
                                  >
                                    {log.totalVolume.toLocaleString()} kg
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'rgba(255,255,255,0.35)',
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={20} />
                                  ) : (
                                    <ChevronDown size={20} />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="history-item-body"
                                >
                                  {log.notes && (
                                    <p
                                      style={{
                                        fontStyle: 'italic',
                                        margin: '0 0 1rem',
                                        color: 'rgba(255,255,255,0.45)',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      " {log.notes} "
                                    </p>
                                  )}

                                  {log.exercises.map((ex, exIdx) => (
                                    <div
                                      className="history-exercise-log"
                                      key={exIdx}
                                    >
                                      <h5 className="history-exercise-title">
                                        {ex.exerciseName}
                                      </h5>
                                      {ex.sets.map((set, setIdx) => (
                                        <div
                                          className="history-set-bullet"
                                          key={setIdx}
                                        >
                                          <span className="history-set-num">
                                            Set {set.setNumber}
                                          </span>
                                          <span>
                                            {set.weight ?? 0} kg ×{' '}
                                            {set.reps ?? 0} reps
                                            {set.isWarmup && (
                                              <span
                                                style={{
                                                  color: '#EAB308',
                                                  marginLeft: '8px',
                                                  fontSize: '0.7rem',
                                                  fontWeight: 700,
                                                }}
                                              >
                                                WARMUP
                                              </span>
                                            )}
                                            {set.rpe && (
                                              <span
                                                style={{
                                                  color:
                                                    'rgba(255,255,255,0.35)',
                                                  marginLeft: '10px',
                                                }}
                                              >
                                                RPE {set.rpe}
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {historyTotalPages > 1 && (
                      <div className="pagination-row">
                        <button
                          className="page-btn"
                          disabled={historyPage === 1}
                          onClick={() => setHistoryPage(historyPage - 1)}
                        >
                          Previous
                        </button>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          Page {historyPage} of {historyTotalPages}
                        </span>
                        <button
                          className="page-btn"
                          disabled={historyPage === historyTotalPages}
                          onClick={() => setHistoryPage(historyPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Add Exercise Selector Modal (Active Session) ────────────── */}
      <AnimatePresence>
        {showAddExModal && (
          <div
            className="workout-modal-overlay"
            onClick={() => setShowAddExModal(false)}
          >
            <div
              className="workout-modal-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="workout-modal-glow" />
              <button
                className="workout-modal-close"
                onClick={() => setShowAddExModal(false)}
              >
                ✕
              </button>
              <h3 className="workout-modal-title">Select Exercise 📖</h3>

              {/* Instant filters */}
              <input
                type="text"
                className="library-search-input"
                placeholder="Search exercise..."
                value={libSearch}
                style={{ marginBottom: '1rem' }}
                onChange={(e) => setLibSearch(e.target.value)}
              />

              <div
                className="library-filters"
                style={{ marginBottom: '1.25rem' }}
              >
                <select
                  className="library-select"
                  value={libMuscle}
                  onChange={(e) => setLibMuscle(e.target.value)}
                >
                  <option value="">All Muscles</option>
                  {Object.values(MuscleGroup).map((m) => (
                    <option key={m} value={m}>
                      {m.toUpperCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>

                <select
                  className="library-select"
                  value={libEquipment}
                  onChange={(e) => setLibEquipment(e.target.value)}
                >
                  <option value="">All Equipment</option>
                  {Object.values(Equipment).map((eq) => (
                    <option key={eq} value={eq}>
                      {eq.toUpperCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div
                style={{
                  maxHeight: '350px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {libLoading ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Loading...
                  </div>
                ) : exercises.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    No results found.
                  </div>
                ) : (
                  exercises.map((ex) => {
                    const isAdded = activeWorkout.exercises.some(
                      (e) => e.exerciseId === ex._id,
                    );
                    return (
                      <div
                        key={ex._id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isAdded ? `${PURPLE}40` : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '12px',
                          padding: '0.8rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {ex.name}
                          </div>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {ex.muscleGroup} • {ex.equipment}
                          </span>
                        </div>
                        <button
                          disabled={isAdded}
                          onClick={() => {
                            addExercise(ex._id, ex.name);
                            setShowAddExModal(false);
                          }}
                          style={{
                            background: isAdded ? 'transparent' : PURPLE,
                            color: isAdded ? 'rgba(255,255,255,0.3)' : '#fff',
                            border: isAdded ? 'none' : 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: isAdded ? 'default' : 'pointer',
                          }}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Exercise Details Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedExercise && (
          <div
            className="workout-modal-overlay"
            onClick={() => setSelectedExercise(null)}
          >
            <div
              className="workout-modal-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="workout-modal-glow" />
              <button
                className="workout-modal-close"
                onClick={() => setSelectedExercise(null)}
              >
                ✕
              </button>

              <h3 className="workout-modal-title" style={{ color: PURPLE }}>
                {selectedExercise.name}
              </h3>

              <div
                style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}
              >
                <span
                  className="exercise-meta-tag"
                  style={{ color: LIME, backgroundColor: `${LIME}14` }}
                >
                  {selectedExercise.muscleGroup}
                </span>
                <span
                  className="exercise-meta-tag"
                  style={{ color: CYAN, backgroundColor: `${CYAN}14` }}
                >
                  {selectedExercise.equipment}
                </span>
                <span
                  className="exercise-meta-tag"
                  style={{ color: PURPLE, backgroundColor: `${PURPLE}14` }}
                >
                  {selectedExercise.difficulty}
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 800,
                  }}
                >
                  Instructions:
                </h4>
                {selectedExercise.instructions.length === 0 ? (
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.85rem',
                    }}
                  >
                    No step instructions available.
                  </p>
                ) : (
                  selectedExercise.instructions.map((step, idx) => (
                    <div className="instruction-step" key={idx}>
                      <span>{idx + 1}</span>
                      <div>{step}</div>
                    </div>
                  ))
                )}
              </div>

              {activeWorkout.isActive && (
                <button
                  className="finish-session-btn"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={() => {
                    addExercise(selectedExercise._id, selectedExercise.name);
                    setSelectedExercise(null);
                    setSuccessMsg(
                      `"${selectedExercise.name}" added to active workout!`,
                    );
                    setTimeout(() => setSuccessMsg(null), 2500);
                  }}
                >
                  Add to Active Workout 🏋️
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
