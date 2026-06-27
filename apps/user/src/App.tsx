import { useState } from 'react';
import { onboardingSchema } from 'gymfuel-shared';

export default function App() {
  const [age, setAge] = useState<number>(25);
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(175);
  const [goal, setGoal] = useState<
    'lose_weight' | 'build_muscle' | 'maintain_weight'
  >('build_muscle');
  const gender = 'male';
  const activityLevel = 'moderate';
  const [validationMsg, setValidationMsg] = useState<string>('');

  const handleValidate = () => {
    const result = onboardingSchema.safeParse({
      age,
      weight,
      height,
      gender,
      activityLevel,
      goal,
    });
    if (result.success) {
      setValidationMsg('✅ Onboarding data is valid!');
    } else {
      setValidationMsg(
        `❌ Validation failed: ${result.error.errors[0].message}`,
      );
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>GymFuel User Dashboard</h1>
      <p>Welcome to your fitness and nutrition tracker.</p>

      <div
        style={{
          border: '1px solid #ccc',
          padding: '1rem',
          marginTop: '1rem',
          borderRadius: '8px',
        }}
      >
        <h3>Onboarding Mock Validator</h3>
        <label>
          Age:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Weight (kg):
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Height (cm):
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Goal:
          <select
            value={goal}
            onChange={(e) =>
              setGoal(
                e.target.value as
                  | 'lose_weight'
                  | 'build_muscle'
                  | 'maintain_weight',
              )
            }
          >
            <option value="lose_weight">Lose Weight</option>
            <option value="build_muscle">Build Muscle</option>
            <option value="maintain_weight">Maintain Weight</option>
          </select>
        </label>
        <br />
        <br />
        <button onClick={handleValidate}>Validate Data</button>
        {validationMsg && <p>{validationMsg}</p>}
      </div>
    </div>
  );
}
