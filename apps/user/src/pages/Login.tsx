import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const navigate = useNavigate();

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: signUpErrors },
    reset: resetSignUpForm,
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    clearError();
    resetLoginForm();
    resetSignUpForm();
  };

  const handleEmailLogin = async (data: LoginFormInputs) => {
    try {
      const user = await loginWithEmail(data.email, data.password);
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch {
      // Error is stored in authStore
    }
  };

  const handleEmailRegister = async (data: RegisterFormInputs) => {
    try {
      const user = await registerWithEmail(
        data.name,
        data.email,
        data.password,
      );
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch {
      // Error is stored in authStore
    }
  };

  const handleGoogleLogin = async () => {
    try {
      clearError();
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const user = await loginWithGoogle(idToken);
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      console.error('Google Auth Popup failed', err);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(0, 255, 136, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 212, 255, 0.05) 0%, transparent 40%)',
        color: '#ffffff',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#16161a',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 136, 0.02)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem 1.2rem',
              backgroundColor: 'rgba(0, 255, 136, 0.08)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              borderRadius: '9999px',
              color: '#00ff88',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              boxShadow: '0 0 15px rgba(0, 255, 136, 0.1)',
            }}
          >
            GymFuel
          </motion.div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>
            {isRegister
              ? 'Start your fitness journey today'
              : 'Log in to track your macros and workouts'}
          </p>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#e4e4e7',
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor =
                'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = '#3f3f46';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#27272a';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4c2.34-2.16 3.68-5.32 3.68-8.75Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4-3.13c-1.11.75-2.54 1.19-3.93 1.19-3.03 0-5.6-2.05-6.51-4.82H1.31v3.23A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.49 14.33a7.22 7.22 0 0 1 0-4.66V6.44H1.31a12 12 0 0 0 0 11.12l4.18-3.23Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A12 12 0 0 0 1.31 6.44l4.18 3.23C6.4 6.8 8.97 4.75 12 4.75Z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
          <span
            style={{
              fontSize: '0.75rem',
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                }}
              >
                <AlertCircle
                  size={18}
                  style={{ flexShrink: 0, marginTop: '0.1rem' }}
                />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login/Register Forms */}
        {!isRegister ? (
          <form
            onSubmit={handleSubmitLogin(handleEmailLogin)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Email Field */}
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...registerLogin('email')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: loginErrors.email
                      ? '1px solid #ef4444'
                      : '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!loginErrors.email)
                      e.target.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    if (!loginErrors.email)
                      e.target.style.borderColor = '#27272a';
                  }}
                />
              </div>
              {loginErrors.email && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {loginErrors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...registerLogin('password')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: loginErrors.password
                      ? '1px solid #ef4444'
                      : '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!loginErrors.password)
                      e.target.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    if (!loginErrors.password)
                      e.target.style.borderColor = '#27272a';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginErrors.password && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {loginErrors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: '#00ff88',
                color: '#09090b',
                border: 'none',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 255, 136, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#00e676';
                  e.currentTarget.style.boxShadow =
                    '0 6px 20px rgba(0, 255, 136, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff88';
                e.currentTarget.style.boxShadow =
                  '0 4px 14px rgba(0, 255, 136, 0.25)';
              }}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSubmitSignUp(handleEmailRegister)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Full Name Field */}
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
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
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
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading}
                  {...registerSignUp('name')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: signUpErrors.name
                      ? '1px solid #ef4444'
                      : '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!signUpErrors.name)
                      e.target.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    if (!signUpErrors.name)
                      e.target.style.borderColor = '#27272a';
                  }}
                />
              </div>
              {signUpErrors.name && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {signUpErrors.name.message}
                </span>
              )}
            </div>

            {/* Email Field */}
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...registerSignUp('email')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: signUpErrors.email
                      ? '1px solid #ef4444'
                      : '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!signUpErrors.email)
                      e.target.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    if (!signUpErrors.email)
                      e.target.style.borderColor = '#27272a';
                  }}
                />
              </div>
              {signUpErrors.email && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {signUpErrors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...registerSignUp('password')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: signUpErrors.password
                      ? '1px solid #ef4444'
                      : '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!signUpErrors.password)
                      e.target.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    if (!signUpErrors.password)
                      e.target.style.borderColor = '#27272a';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {signUpErrors.password && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {signUpErrors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: '#00ff88',
                color: '#09090b',
                border: 'none',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 255, 136, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#00e676';
                  e.currentTarget.style.boxShadow =
                    '0 6px 20px rgba(0, 255, 136, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff88';
                e.currentTarget.style.boxShadow =
                  '0 4px 14px rgba(0, 255, 136, 0.25)';
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={handleToggleMode}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff88',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
