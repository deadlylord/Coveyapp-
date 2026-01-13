
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, auth } from '../firebase';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              <input 
                type="password" 
                placeholder="••••••••••••" 
                className="w-full p-5 bg-black/40 border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white font-bold transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
