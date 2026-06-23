import React, { useState } from "react";
import { 
  auth, 
  seedDatabaseIfEmpty 
} from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { Sun, Battery, Lightbulb, ShieldAlert, KeyRound, Mail, UserPlus, Zap } from "lucide-react";

interface AuthContainerProps {
  onAuthSuccess: (userEmail: string, isDemo: boolean) => void;
}

export default function AuthContainer({ onAuthSuccess }: AuthContainerProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor complete todos los campos.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Automatic seed just in case database is empty
        await seedDatabaseIfEmpty();
        onAuthSuccess(userCred.user.email || "usuario@empresa.com", false);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await seedDatabaseIfEmpty();
        onAuthSuccess(userCred.user.email || "usuario@empresa.com", false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Credenciales incorrectas. Verifique su correo o contraseña.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es muy débil (mínimo 6 caracteres).");
      } else if (err.code === "auth/email-already-in-use") {
        setError("El correo electrónico ya está registrado.");
      } else {
        setError("Error de autenticación: " + (err.message || "Inténtelo de nuevo"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const userCred = await signInAnonymously(auth);
      // Auto seed ensures a rich experience for demo login
      await seedDatabaseIfEmpty();
      onAuthSuccess("operador.demo@energistock.com", true);
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar sesión de demostración: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      await seedDatabaseIfEmpty();
      onAuthSuccess(userCred.user.email || "usuario.google@empresa.com", false);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("El inicio de sesión con Google fue cancelado.");
      } else {
        setError("Error con Google: " + (err.message || "Inténtelo de nuevo"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      {/* Absolute background visual details */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-indigo-500 p-3 rounded-2xl shadow-xl shadow-amber-500/10 mb-3 animate-pulse">
            <Sun className="h-7 w-7 text-white" />
            <Battery className="h-7 w-7 text-white" />
            <Lightbulb className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            BODEGA <span className="text-amber-500">SOLAR & BESS</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xs">
            Control de inventario, herramientas y logística fotovoltaica integrada con IA.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-800 text-red-200 text-sm rounded-xl flex items-start space-x-2">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm"
                  placeholder="ejemplo@bodega.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center space-x-2 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer text-sm"
            >
              {isSignUp ? <UserPlus className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              <span>{loading ? "Procesando..." : isSignUp ? "Registrar nueva cuenta" : "Iniciar Sesión"}</span>
            </button>
          </form>

          {/* Tab toggler */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-amber-500 hover:underline hover:text-amber-400 outline-none"
              disabled={loading}
            >
              {isSignUp ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase tracking-wider">O también</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer text-sm mb-3"
          >
            <span>Continuar con Google</span>
          </button>

          {/* One click Demo Access */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Acceso de Demostración Completo</span>
          </button>
        </div>

        {/* Footer info card */}
        <div className="mt-6 p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900 text-center">
          <p className="text-zinc-500 text-xs">
            Esta aplicación requiere Firestore y Firebase Auth. El instalador inteligente creará índices y semillas cargadas automáticamente al primer ingreso.
          </p>
        </div>
      </div>
    </div>
  );
}
