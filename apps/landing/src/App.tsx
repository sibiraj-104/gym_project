import { useState, FormEvent } from 'react';

export default function App() {
  const [email, setEmail] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMsg('❌ Please enter a valid email address.');
      return;
    }
    setMsg('🎉 Thank you for subscribing! We will notify you when we launch.');
    setEmail('');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>GymFuel — Your Ultimate Fitness Partner</h1>
      <p style={{ color: '#555', fontSize: '1.2rem' }}>
        Track your calories, scanner foods with AI, plan custom workouts, and get fit.
      </p>

      <form onSubmit={handleSubscribe} style={{ marginTop: '2rem' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem', width: '250px', marginRight: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
          Get Early Access
        </button>
      </form>
      {msg && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{msg}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '3rem' }}>
        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
          <h3>🥗 Food Scanning</h3>
          <p>Scan barcode or snap photo. Get calorie/nutrient counts instantly powered by Gemini.</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
          <h3>🏋️ Custom Workouts</h3>
          <p>Log exercise templates. Analyze progress charts and achievements.</p>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
          <h3>🤖 AI Fitness Coach</h3>
          <p>Get personalized diet plans and answer workouts questions via chat.</p>
        </div>
      </div>
    </div>
  );
}
