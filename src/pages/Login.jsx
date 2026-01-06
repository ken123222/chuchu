import { useState } from "react";
import axios from "../api/axiosConfig";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, ArrowRight, Activity } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      // ✅ FIXED: Removed "/api" to avoid /api/api/ 404 error
      const res = await axios.post("/auth/login", { email, password });
      
      localStorage.setItem("token", res.data.token);
      setErrorMessage("");
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      localStorage.removeItem("token");
      const serverMsg = err.response?.data?.message || "Login failed";
      // Map server message to friendlier errors when possible
      if (err.response?.status === 400 && serverMsg === 'Invalid credentials') {
        setErrorMessage('Incorrect email or password.');
      } else if (err.response?.status === 404) {
        setErrorMessage('Email not registered.');
      } else {
        setErrorMessage(serverMsg);
      }
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          
          <div className="pt-10 pb-6 px-8 text-center bg-white">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 mb-3">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Fit<span className="text-indigo-600">Tracker</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
              Secure Access
            </p>
          </div>

          <div className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {errorMessage}
                  </div>
                )}
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end pr-1">
                  <Link 
                    to="/forgot-password" 
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 mt-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    SIGN IN <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Don't have an account?{" "}
                <Link className="text-indigo-600 font-black hover:underline ml-1" to="/register">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}