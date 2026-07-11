import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Camera, Search, Upload, ChevronLeft, Zap, Info } from 'lucide-react';
import { IFoodItem } from 'gymfuel-shared';
import { foodApi } from '../api/foodApi';
import './Scanner.css';

const LIME = '#C8FF00';
const CYAN = '#00E5FF';
const ORANGE = '#FF6B35';

export default function ScannerPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'barcode' | 'ai'>('barcode');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodResult, setFoodResult] = useState<IFoodItem | null>(null);

  // Barcode state
  const [manualBarcode, setManualBarcode] = useState('');

  // AI Photo state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meal Log State (for modal)
  const [portion, setPortion] = useState<number>(0);
  const [mealType, setMealType] = useState<string>('snack');

  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(null);
  }, [selectedImage]);

  useEffect(() => {
    if (foodResult) {
      setPortion(foodResult.servingSize || 100);
    }
  }, [foodResult]);

  const handleBarcodeScan = async (result: string) => {
    if (loading || foodResult) return;
    setLoading(true);
    setError(null);
    try {
      const item = await foodApi.getByBarcode(result);
      setFoodResult(item);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Barcode not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode) return;
    handleBarcodeScan(manualBarcode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setError(null);
    }
  };

  const handleAIScan = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    try {
      const item = await foodApi.scanImage(selectedImage);
      setFoodResult(item);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to scan image with AI.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = () => {
    // We will implement logging to POST /api/meals/log in the next phase
    // For now, just alert or mock success
    alert(
      `Meal logged! (Stub for Issue #24)\nFood: ${foodResult?.name}\nPortion: ${portion}g\nType: ${mealType}`,
    );
    navigate('/dashboard');
  };

  return (
    <div className="scanner-root">
      <div className="scanner-orbs" aria-hidden>
        <div className="scanner-orb-1" />
        <div className="scanner-orb-2" />
        <div className="scanner-orb-3" />
      </div>

      <nav className="scanner-nav">
        <button
          className="scanner-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={20} /> Back
        </button>
      </nav>

      <div className="scanner-page">
        <h1 className="scanner-title">Food Scanner</h1>
        <p className="scanner-subtitle">
          Instantly look up nutrition facts with barcodes or our Gemini AI.
        </p>

        <div className="scanner-tabs">
          <div
            className={`scanner-tab ${tab === 'barcode' ? 'active' : ''}`}
            onClick={() => setTab('barcode')}
          >
            <Camera
              size={18}
              style={{
                display: 'inline',
                verticalAlign: 'text-bottom',
                marginRight: '4px',
              }}
            />
            Barcode
          </div>
          <div
            className={`scanner-tab ${tab === 'ai' ? 'active' : ''}`}
            onClick={() => setTab('ai')}
          >
            <Zap
              size={18}
              style={{
                display: 'inline',
                verticalAlign: 'text-bottom',
                marginRight: '4px',
              }}
            />
            AI Photo Scan
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 60, 60, 0.1)',
              border: '1px solid rgba(255, 60, 60, 0.4)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              color: '#ff8a8a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Info size={18} /> {error}
          </div>
        )}

        <div className="scanner-area">
          {tab === 'barcode' && (
            <>
              <div className="scanner-camera-box">
                {/* Hide scanner if loading or results shown to prevent continuous scanning */}
                {!loading && !foodResult ? (
                  <Scanner
                    onScan={(result) => handleBarcodeScan(result[0].rawValue)}
                    components={{ finder: true }}
                  />
                ) : (
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    {loading ? (
                      <Zap className="animate-pulse" size={32} color={LIME} />
                    ) : (
                      <Camera size={32} />
                    )}
                    {loading ? 'Looking up...' : 'Paused'}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleManualBarcode}
                className="scanner-input-group"
              >
                <label>Manual Barcode Entry</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="scanner-input"
                    style={{ flex: 1 }}
                    placeholder="Enter numbers..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="scanner-btn"
                    disabled={loading || !manualBarcode}
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
            </>
          )}

          {tab === 'ai' && (
            <>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />

              {!selectedImage ? (
                <div
                  className="scanner-camera-box"
                  style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <Upload size={48} />
                    <span>Tap to take a photo or upload</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <img
                    src={imagePreview!}
                    alt="Preview"
                    className="scanner-photo-preview"
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="scanner-btn secondary"
                      style={{ flex: 1 }}
                      onClick={() => setSelectedImage(null)}
                    >
                      Retake
                    </button>
                    <button
                      className="scanner-btn"
                      style={{ flex: 2 }}
                      onClick={handleAIScan}
                      disabled={loading}
                    >
                      {loading ? 'Analyzing with AI...' : 'Analyze with AI ⚡'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {foodResult && (
          <motion.div
            className="scanner-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="scanner-modal"
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="scanner-modal-header">
                {foodResult.brand && (
                  <div className="scanner-modal-brand">{foodResult.brand}</div>
                )}
                <h2 className="scanner-modal-title">{foodResult.name}</h2>
              </div>

              <div className="scanner-nutrition-grid">
                <div className="scanner-nut-item">
                  <div className="scanner-nut-val" style={{ color: LIME }}>
                    {foodResult.nutrition.calories}
                  </div>
                  <div className="scanner-nut-label">Calories</div>
                </div>
                <div className="scanner-nut-item">
                  <div className="scanner-nut-val">
                    {foodResult.servingSize}
                    {foodResult.servingUnit}
                  </div>
                  <div className="scanner-nut-label">Serving Size</div>
                </div>
              </div>

              <div className="scanner-macro-row">
                <div
                  className="scanner-macro-tag"
                  style={{ background: `${LIME}15`, color: LIME }}
                >
                  P: {foodResult.nutrition.protein}g
                </div>
                <div
                  className="scanner-macro-tag"
                  style={{ background: `${CYAN}15`, color: CYAN }}
                >
                  C: {foodResult.nutrition.carbs}g
                </div>
                <div
                  className="scanner-macro-tag"
                  style={{ background: `${ORANGE}15`, color: ORANGE }}
                >
                  F: {foodResult.nutrition.fat}g
                </div>
              </div>

              <div className="scanner-input-group">
                <label>Portion Consumed (grams)</label>
                <input
                  type="number"
                  className="scanner-input"
                  value={portion}
                  onChange={(e) => setPortion(Number(e.target.value))}
                />
              </div>

              <div className="scanner-input-group">
                <label>Meal Type</label>
                <select
                  className="scanner-select"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div
                style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}
              >
                <button
                  className="scanner-btn secondary"
                  style={{ flex: 1 }}
                  onClick={() => setFoodResult(null)}
                >
                  Cancel
                </button>
                <button
                  className="scanner-btn"
                  style={{ flex: 2 }}
                  onClick={handleLogMeal}
                >
                  Log Meal ⚡
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
