import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });

  // Calculate password strength simple logic
  const getStrength = () => {
    if (formData.password.length === 0) return 0;
    if (formData.password.length < 6) return 1;
    if (formData.password.length < 10) return 2;
    return 3;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);
    try {
      await axios.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });
      
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect after showing the success state
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">All Set!</h2>
          <p className="text-slate-500 font-medium mb-4">Your password has been updated.</p>
          <p className="text-sm text-indigo-600 font-bold animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-[3rem] shadow-2xl shadow-slate-200 border border-white">
        <div className="mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Password</h2>
          <p className="text-slate-500 font-medium">Create a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1 w-4 rounded-full transition-colors ${i < getStrength() ? (getStrength() === 1 ? 'bg-red-400' : getStrength() === 2 ? 'bg-yellow-400' : 'bg-green-400') : 'bg-slate-200'}`} 
                        />
                    ))}
                </div>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type={showPass ? "text" : "password"}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all font-medium text-slate-700"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-2xl focus:bg-white focus:ring-0 transition-all font-medium text-slate-700 ${
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-100' : 'border-transparent focus:border-indigo-500'
                }`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 mt-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                UPDATE PASSWORD
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}