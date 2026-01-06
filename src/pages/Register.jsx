import { useState } from "react";
import axios from "../api/axiosConfig";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Calendar, Target, Ruler, Weight, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age.toString() : "";
};

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailTaken, setEmailTaken] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [formData, setFormData] = useState({
    fullName: "", email: "", age: "", weight: "", height: "", birthday: "", goal: "", password: "", confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "birthday") {
      setFormData((prev) => ({ ...prev, [name]: value, age: calculateAge(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Password Check
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    // 2. Fitness Goal Check
    if (!formData.goal) return toast.error("Please select a fitness goal");

    // 3. Email domain validation: allow gmail, yahoo, outlook
    const allowedDomainRegex = /^[^\s@]+@(?:gmail|yahoo|outlook)\.com$/i;
    if (!allowedDomainRegex.test(formData.email.toLowerCase())) {
      setErrorMessage("Please use an email from @gmail.com, @yahoo.com or @outlook.com");
      return;
    }

    // 4. Birthday should not be in the future and user must be at least 13
    if (formData.birthday) {
      const b = new Date(formData.birthday);
      const today = new Date();
      if (isNaN(b.getTime())) {
        setErrorMessage('Invalid birthday');
        return;
      }
      if (b > today) {
        setErrorMessage('Birthday cannot be in the future');
        return;
      }
      const ageNum = Number(calculateAge(formData.birthday)) || 0;
      if (ageNum < 13) {
        setErrorMessage('You must be at least 13 years old to register');
        return;
      }
    }

    setErrorMessage("");
    setLoading(true);
    try {
      // require email verification
      if (!emailVerified) {
        setErrorMessage('Please verify your email with the code sent to it before registering.');
        setLoading(false);
        return;
      }
      const payload = {
        fullName: formData.fullName,
        email: formData.email.toLowerCase(),
        password: formData.password,
        fitnessGoal: formData.goal,
        age: Number(formData.age),
        weightKg: Number(formData.weight),
        heightCm: Number(formData.height),
        dob: formData.birthday,
      };

      // ✅ FIXED: Removed "/api" to avoid /api/api/ 404 error
      const res = await axios.post("/auth/register", payload);
      setErrorMessage("");
      toast.success(res.data.message || "Registration successful! You can now log in.");
      navigate("/login");
    } catch (error) {
      // 4. 🎯 Error Catcher for specific server responses
      const serverMessage = error.response?.data?.message;
      if (serverMessage === "Email or username exists") {
        setErrorMessage("This email is already registered. Try logging in!");
        toast.error("This email is already registered. Try logging in!");
      } else {
        setErrorMessage(serverMessage || "Registration failed. Please try again.");
        toast.error(serverMessage || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    const email = (formData.email || '').trim().toLowerCase();
    if (!email) return toast.error('Enter an email first');
    try {
      setCheckingEmail(true);
      await axios.post('/auth/send-code', { email });
      setCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setCheckingEmail(false);
    }
  };

  const verifyCode = async (code) => {
    const email = (formData.email || '').trim().toLowerCase();
    if (!email) return toast.error('Enter an email first');
    try {
      setCheckingEmail(true);
      await axios.post('/auth/verify-code', { email, code });
      setEmailVerified(true);
      setCodeSent(false);
      toast.success('Email verified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setCheckingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
        <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 font-bold transition">
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-black text-slate-900">Create Account</h1>
        <p className="text-slate-500 mb-8 font-medium">Start your fitness journey today.</p>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {errorMessage && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          <div className="md:col-span-2 relative">
            <User className="absolute left-4 top-4 text-slate-400" size={18} />
            <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition" required />
          </div>

          <div className="md:col-span-2 relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => { setEmailTaken(null); setEmailVerified(false); setCodeInput(''); setCodeSent(false); handleChange(e); }}
              onBlur={async () => {
                const email = (formData.email || '').trim().toLowerCase();
                const allowedDomainRegex = /^[^\s@]+@(?:gmail|yahoo|outlook)\.com$/i;
                if (!email || !allowedDomainRegex.test(email)) return;
                try {
                  setCheckingEmail(true);
                  const res = await axios.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
                  setEmailTaken(res.data?.exists === true);
                } catch (err) {
                  console.error('Email check failed', err);
                  setEmailTaken(null);
                } finally {
                  setCheckingEmail(false);
                }
              }}
              placeholder="Email (Gmail/Yahoo/Outlook)"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              required
            />

            {/* Inline email status */}
            <div className="mt-2 text-sm">
              {checkingEmail ? (
                <span className="text-slate-500">Checking email…</span>
              ) : emailTaken === true ? (
                <span className="text-red-600">This email is already registered. Try logging in.</span>
              ) : emailVerified ? (
                <span className="text-green-600">Email verified</span>
              ) : emailTaken === false ? (
                <span className="text-green-600">Email available</span>
              ) : null}
            </div>
            {/* Send code / verify UI */}
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={sendVerificationCode} disabled={checkingEmail || emailTaken === true || emailVerified} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                {checkingEmail ? 'Sending…' : 'Send verification code'}
              </button>
              <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Enter code" className="pl-3 py-2 border rounded-md text-sm" />
              <button type="button" onClick={() => verifyCode(codeInput)} disabled={!codeInput || checkingEmail || emailVerified} className="px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm">
                Verify
              </button>
            </div>
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-4 text-slate-400" size={18} />
            <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none" required />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-4 text-slate-400 text-[10px] font-black tracking-widest uppercase">Age</div>
            <input type="number" name="age" value={formData.age} readOnly className="w-full pl-16 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-indigo-600 cursor-not-allowed" placeholder="Age" />
          </div>

          <div className="relative">
            <Weight className="absolute left-4 top-4 text-slate-400" size={18} />
            <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight (kg)" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none" />
          </div>

          <div className="relative">
            <Ruler className="absolute left-4 top-4 text-slate-400" size={18} />
            <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="Height (cm)" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none" />
          </div>

          <div className="md:col-span-2 relative">
            <Target className="absolute left-4 top-4 text-slate-400" size={18} />
            <select name="goal" value={formData.goal} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl appearance-none outline-none" required>
              <option value="">Select Fitness Goal</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Strength Gain">Strength Gain</option>
              <option value="General Fitness">General Fitness</option>
            </select>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition" required />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition" required />
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex justify-center items-center active:scale-95 disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" /> : "CREATE ACCOUNT"}
          </button>
        </form>
      </div>
    </div>
  );
}