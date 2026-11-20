import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../Pages.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'register') { await register(name, email, password); navigate('/dashboard'); }
      else if (mode === 'login') { await login(email, password); navigate('/dashboard'); }
    } catch (err) { setError(err.message || 'Request failed'); }
    finally { setLoading(false); }
  }

  return (
    <main className="main-content" style={{ maxWidth: 460, margin: '2rem auto' }}>
      <section className="planner-card">
        <div className="card-heading"><div>
          <p className="section-kicker">Yatra Mitra</p>
          <h1>{mode==='register'?'Create account':'Login'}</h1>
          <p>Secure access to your trips, wishlist, history, and dashboard (saved in MongoDB).</p>
        </div></div>
        <form onSubmit={handleSubmit} className="ai-brief-form">
          {mode==='register' && <div className="form-group"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} required /></div>}
          {(mode==='login'||mode==='register') && <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>}
          {(mode==='login'||mode==='register') && <div className="form-group"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} /></div>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button type="submit" className="plan-button" disabled={loading}>{loading?'Please wait...':mode==='register'?'Register':'Login'}</button>
        </form>
        <div style={{marginTop:'1rem',display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
          {(mode==='login'||mode==='register') && <button type="button" className="remove-button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}}>{mode==='login'?'Create account':'Have an account? Login'}</button>}
        </div>
      </section>
    </main>
  );
}
