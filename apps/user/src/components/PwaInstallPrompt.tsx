import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, WifiOff, CheckCircle2 } from 'lucide-react';
import {
  syncOfflineWorkouts,
  getOfflineWorkoutsQueue,
} from '../utils/offlineStorage';
import { workoutApi } from '../api/workoutApi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for online / offline events
    const handleOnline = async () => {
      setIsOffline(false);
      const queue = getOfflineWorkoutsQueue();
      if (queue.length > 0) {
        setSyncMessage(`Syncing ${queue.length} offline workout(s)...`);
        const { syncedCount } = await syncOfflineWorkouts(
          workoutApi.logWorkout,
        );
        if (syncedCount > 0) {
          setSyncMessage(
            `Successfully synced ${syncedCount} workout(s) to cloud!`,
          );
          setTimeout(() => setSyncMessage(null), 4000);
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {/* Offline Alert Badge */}
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(255, 140, 0, 0.95)',
            color: '#000',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(255, 140, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <WifiOff size={14} />
          <span>Offline Mode — Workouts will queue locally</span>
        </motion.div>
      )}

      {/* Sync Success Notification */}
      {syncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(200, 255, 0, 0.95)',
            color: '#000',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 15px rgba(200, 255, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{syncMessage}</span>
        </motion.div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            maxWidth: '480px',
            margin: '0 auto',
            zIndex: 9999,
            backgroundColor: 'rgba(18, 20, 29, 0.95)',
            border: '1px solid rgba(200, 255, 0, 0.3)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow:
              '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(200, 255, 0, 0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #C8FF00, #00E5FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#000',
                fontSize: '1.2rem',
              }}
            >
              ⚡
            </div>
            <div>
              <div
                style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}
              >
                Install GymFuel App
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                Fast, offline-ready macro & workout tracker
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleInstallClick}
              style={{
                background: '#C8FF00',
                color: '#000',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Download size={14} />
              <span>Install</span>
            </button>

            <button
              onClick={() => setShowInstallBanner(false)}
              style={{
                background: 'transparent',
                color: '#9CA3AF',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
