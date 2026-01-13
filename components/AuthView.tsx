
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, auth } from '../firebase';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/weak-password':
        return 'Contraseña débil: Mínimo 6 caracteres requeridos.';
      case 'auth/email-already-in-use':
        return 'Esta identidad ya existe. Intenta loguearte.';
      case 'auth/invalid-email':
        return 'El formato del email no es válido.';
      case 'auth/user-not-found':
        return 'No se encontró ninguna identidad con este email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Credenciales inválidas. Verifica tu acceso.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revisa tu enlace neural (Internet).';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Acceso bloqueado temporalmente.';
      default:
        return 'Error de Sincronización Neural. Reintenta.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Introduce un email operativo.');
      return;
    }
    
    if (mode !== 'FORGOT' && (!password || password.length < 6)) {
        setError('Seguridad insuficiente: Mínimo 6 caracteres.');
        return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'SIGNUP') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'FORGOT') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Protocolo de restablecimiento enviado. Revisa tu bandeja de entrada.');
      }
    } catch (err: any) {
      console.error("Auth Error Code:", err.code);
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0A0F1E] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#BC00FF]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#131B2E] p-10 rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-8 animate-in zoom-in-95 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-1 rounded-full bg-[#BC00FF]/10 border border-[#BC00FF]/30 mb-2">
            <span className="mono text-[8px] font-black uppercase text-[#BC00FF] tracking-[0.3em]">Neural Interface v8.6</span>
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Core Assist</h2>
          <p className="mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em]">
            {mode === 'LOGIN' && 'Iniciando Protocolo de Acceso'}
            {mode === 'SIGNUP' && 'Creando Nueva Identidad'}
            {mode === 'FORGOT' && 'Recuperación de Enlace Neural'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="mono text-[8px] font-black text-slate-600 uppercase ml-2 tracking-widest">Credencial Email</label>
            <input 
              type="email" 
              placeholder="id_operativo@neural.net" 
              className="w-full p-5 bg-black/40 border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white font-bold transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'FORGOT' && (
            <div className="space-y-1">
              <label className="mono text-[8px] font-black text-slate-600 uppercase ml-2 tracking-widest">Neural Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  className="w-full p-5 pr-14 bg-black/40 border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white font-bold transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#BC00FF] transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === 'LOGIN' && (
                <div className="flex justify-end pt-1">
                   <button 
                      type="button"
                      onClick={() => { setMode('FORGOT'); setError(''); setSuccess(''); }}
                      className="mono text-[8px] font-black text-[#BC00FF] hover:text-white uppercase tracking-widest transition-colors"
                   >
                     ¿Perdiste el acceso?
                   </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
              <p className="mono text-[9px] font-black text-red-500 uppercase leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
              <p className="mono text-[9px] font-black text-emerald-500 uppercase leading-relaxed">{success}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-[#BC00FF] text-white rounded-3xl font-black uppercase tracking-widest italic shadow-[0_15px_30px_rgba(188,0,255,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Transmitiendo...' : 
              mode === 'LOGIN' ? 'Entrar al Sistema' : 
              mode === 'SIGNUP' ? 'Vincular Identidad' : 'Enviar Enlace de Reseteo'}
          </button>
        </form>

        <div className="text-center space-y-4">
          {mode !== 'LOGIN' && (
            <button 
                onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}
                className="mono text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors block w-full"
            >
                Volver al Logueo
            </button>
          )}
          {mode === 'LOGIN' && (
            <button 
                onClick={() => { setMode('SIGNUP'); setError(''); setSuccess(''); }}
                className="mono text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors block w-full"
            >
                ¿No tienes identidad? Regístrate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
