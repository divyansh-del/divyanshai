
import React, { useState } from 'react';
import * as Icons from './Icons';
import { supabase } from '../services/supabaseClient';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  // Intelligent Email Validation
  const validateEmail = (email: string): string | null => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Please enter a valid email address.";
    }
    if (trimmed.endsWith('@gamil.com')) return "Did you mean @gmail.com? Check spelling.";
    if (trimmed.endsWith('@yaho.com')) return "Did you mean @yahoo.com? Check spelling.";
    return null;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
        setErrorMsg(emailError);
        setLoading(false);
        return;
    }

    try {
      if (!supabase) {
         // Fallback if supabase not configured (dev mode)
         setTimeout(() => { setLoading(false); onLoginSuccess(); }, 1000);
         return;
      }

      if (isLogin) {
        // --- LOGIN FLOW ---
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
            if (error.message.includes("Email not confirmed")) {
                setShowResend(true);
                setShowOtpInput(true); // Allow entering code if they have one
                throw new Error("Email not confirmed. Please enter the code sent to your email.");
            }
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("Incorrect email or password.");
            }
            throw error;
        }
        onLoginSuccess();
      } else {
        // --- SIGNUP FLOW ---
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
              data: {
                  full_name: trimmedEmail.split('@')[0]
              }
          }
        });
        
        if (error) {
            if (error.message.includes("already registered")) {
                 setSuccessMsg("Account exists. Logging you in...");
                 setTimeout(() => {
                    setIsLogin(true);
                    setLoading(false);
                 }, 1500);
                 return;
            }
            throw error;
        }
        
        // If session created immediately
        if (data.session) {
            onLoginSuccess();
        } else {
            // Success - Check Email
            setShowOtpInput(true);
            setSuccessMsg(`Secure code sent to ${trimmedEmail}`);
            setShowResend(true);

            // AUTO-TRIGGER OTP CODE
            try {
                await supabase.auth.signInWithOtp({ email: trimmedEmail });
            } catch (ign) {}
        }
      }
      
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg(null);
      const trimmedEmail = email.trim().toLowerCase();

      try {
          if (!supabase) return;
          
          // Validate OTP
          let { data, error } = await supabase.auth.verifyOtp({
              email: trimmedEmail,
              token: otp,
              type: 'email' 
          });

          if (error) {
             // Fallback: Try validating as Signup Code
             const res2 = await supabase.auth.verifyOtp({
                 email: trimmedEmail,
                 token: otp,
                 type: 'signup'
             });
             data = res2.data;
             error = res2.error;
          }

          if (error) throw error;

          if (data.session) {
              setSuccessMsg("Verified! Logging in...");
              setTimeout(() => {
                  onLoginSuccess();
              }, 800);
          } else {
              throw new Error("Invalid code. Please try again.");
          }

      } catch (err: any) {
           setErrorMsg(err.message || "Invalid Code. Please check and try again.");
      } finally {
          setLoading(false);
      }
  };

  const handleResendCode = async () => {
      if (!supabase) return;
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const trimmedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({ email: trimmedEmail });
      
      setLoading(false);
      if (error) {
          setErrorMsg("Please wait 60s before retrying.");
      } else {
          setSuccessMsg("New code sent to your email!");
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-950 text-white p-4 animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
           <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
             <Icons.Bot className="w-8 h-8 text-white" />
           </div>
        </div>
        
        {/* Header */}
        <h2 className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {showOtpInput ? 'Security Check' : (isLogin ? 'Welcome Back' : 'Create Account')}
        </h2>
        
        <p className="text-gray-400 text-center text-sm mb-6 px-4">
          {showOtpInput 
            ? 'Please enter the single-use code sent to your email to verify your identity.' 
            : (isLogin ? 'Log in to sync your history and preferences.' : 'Join ChatBharat Ultra for the full experience.')}
        </p>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center flex items-center justify-center gap-2 animate-pulse">
            <Icons.XCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-xs text-center flex items-center justify-center gap-2">
            <Icons.Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* --- FORM --- */}
        {showOtpInput ? (
             <div className="space-y-4">
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
                            maxLength={6}
                            className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-4 text-white text-center text-3xl tracking-[0.5em] focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all placeholder-gray-800 font-mono"
                            placeholder="000000"
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Icons.RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Verify Code'}
                    </button>
                </form>

                <div className="text-center">
                    <button 
                        onClick={handleResendCode}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                    >
                        Resend Code
                    </button>
                </div>
                <button onClick={() => setShowOtpInput(false)} className="w-full text-xs text-gray-500 hover:text-white mt-2">Back</button>
             </div>
        ) : (
            <div className="space-y-4">
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Email</label>
                        <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-500 focus:outline-none transition-all placeholder-gray-600"
                        placeholder="you@example.com"
                        required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Password</label>
                        <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-3 text-white focus:border-brand-500 focus:outline-none transition-all placeholder-gray-600"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2"
                    >
                        {loading ? <Icons.RefreshCw className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                    <div className="relative flex justify-center"><span className="bg-gray-900 px-2 text-xs text-gray-500">OR</span></div>
                </div>

                <button
                    onClick={onLoginSuccess}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2 group"
                >
                    <Icons.User className="w-4 h-4 group-hover:text-white" />
                    Continue as Guest
                </button>

                <div className="text-center mt-4 text-sm">
                    <span className="text-gray-500">{isLogin ? "New here? " : "Already verified? "}</span>
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); setSuccessMsg(null); }}
                        className="text-brand-500 hover:text-brand-400 font-bold ml-1"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
