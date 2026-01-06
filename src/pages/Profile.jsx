import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import {
  Dumbbell,
  Flame,
  Clock,
  Droplet,
  Edit,
  Trash2,
  X,
  Save,
  User as UserIcon,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  // --- BMI STATUS LOGIC ---
  const getBMICategory = (bmi) => {
    const val = parseFloat(bmi);
    if (isNaN(val)) return { label: "N/A", color: "text-slate-400" };
    if (val < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (val < 25) return { label: "Healthy", color: "text-green-500" };
    if (val < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return "N/A";
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const formatTime = (totalHours) => {
    if (typeof totalHours !== 'number' || totalHours < 0 || isNaN(totalHours)) return '0h 0m';
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const fetchUserAndNutrition = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ Works with fixed axiosConfig (no /api/ prefix needed here)
      const userRes = await axios.get("/auth/me");
      setUser(userRes.data);
      setEditData({ ...userRes.data, newPassword: "" });

      try {
        const nutritionRes = await axios.get("/nutrition/today");
        setWaterIntake(nutritionRes.data.currentWaterMl || 0);
      } catch (nutriErr) {
        setWaterIntake(0);
      }
    } catch (err) {
      setError("Unable to load user data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndNutrition();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Updating profile...");
    try {
      const payload = { ...editData };
      // Don't send empty password strings
      if (!payload.newPassword || payload.newPassword.trim() === "") {
        delete payload.newPassword;
      }

      const res = await axios.put("/auth/update", payload);
      setUser(res.data.user); 
      setIsEditModalOpen(false);
      toast.success("Profile updated!", { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    window.location.href = "/"; 
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ DANGER: This action is permanent. Delete your account?")) {
      setIsDeleting(true);
      try {
        await axios.delete("/auth/delete-account");
        localStorage.clear();
        toast.success("Account deleted. Goodbye!");
        setTimeout(() => {
          window.location.href = "/"; 
        }, 1500);
      } catch (err) {
        toast.error("Could not delete account.");
        setIsDeleting(false);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-slate-500">Loading your profile...</p>
    </div>
  );

  if (error) return <div className="p-6 text-red-600 text-center text-xl">{error}</div>;

  const { workouts = 0, calories = 0, timeSpent = 0 } = user.stats || {};
  const currentBMI = calculateBMI(user.weightKg, user.heightCm);
  const bmiInfo = getBMICategory(currentBMI);

  const statCards = [
    { icon: Dumbbell, label: "Workouts", value: workouts, unit: "sessions", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Flame, label: "Calories", value: calories.toLocaleString(), unit: "kcal", color: "text-orange-500", bg: "bg-orange-50" },
    { icon: Clock, label: "Total Time", value: formatTime(timeSpent), unit: "", color: "text-green-500", bg: "bg-green-50" },
    { icon: Droplet, label: "Water", value: (waterIntake / 1000).toFixed(1), unit: "L", color: "text-cyan-500", bg: "bg-cyan-50" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="pt-28 px-4 pb-20 max-w-5xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          
          <div className="relative group">
            <div className="bg-indigo-600 w-32 h-32 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-all duration-300 uppercase">
              {user.fullName?.[0] || "U"}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 leading-none mb-2">{user.fullName}</h1>
            <p className="text-indigo-600 font-bold tracking-tight mb-4 opacity-70">@{user.username || "user"}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-slate-500">
               <span className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"><UserIcon size={14}/> {user.age || "--"} years</span>
               <span className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"><ShieldCheck size={14}/> {user.fitnessGoal || "No Goal"}</span>
            </div>
          </div>
          
          <div className="flex gap-3 self-start">
            <button onClick={() => setIsEditModalOpen(true)} className="p-4 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm active:scale-95" title="Edit Profile">
              <Edit size={22} />
            </button>
            <button onClick={handleDeleteAccount} disabled={isDeleting} className="p-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50" title="Delete Account">
              <Trash2 size={22} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center group hover:border-indigo-200 transition-all hover:shadow-md">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <h2 className="font-black text-2xl text-slate-900 mt-1">{stat.value}</h2>
              {stat.unit && <p className="text-[10px] font-bold text-slate-400">{stat.unit}</p>}
            </div>
          ))}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div> Personal Info
            </h3>
            <div className="space-y-4">
              {[
                { label: "Email", value: user.email },
                { label: "Date of Birth", value: user.dob ? new Date(user.dob).toLocaleDateString() : "N/A" },
                { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <span className="text-sm font-bold text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-green-500 rounded-full"></div> Body Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Height</span>
                <span className="text-sm font-bold text-slate-700">{user.heightCm || 0} cm</span>
              </div>
              <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Weight</span>
                <span className="text-sm font-bold text-slate-700">{user.weightKg || 0} kg</span>
              </div>
              
              <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 border-l-4 border-l-green-400">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Calculated BMI</span>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">{currentBMI}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${bmiInfo.color}`}>
                    {bmiInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">Edit Profile</h2>
            <p className="text-slate-500 font-medium mb-10 tracking-tight">Updating your stats helps us track progress better.</p>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" value={editData.fullName || ""} onChange={(e) => setEditData({...editData, fullName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" value={editData.weightKg || ""} onChange={(e) => setEditData({...editData, weightKg: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height (cm)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" value={editData.heightCm || ""} onChange={(e) => setEditData({...editData, heightCm: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fitness Goal</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none" value={editData.fitnessGoal || ""} onChange={(e) => setEditData({...editData, fitnessGoal: e.target.value})}>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Building">Muscle Building</option>
                  <option value="Endurance">Endurance</option>
                  <option value="General Fitness">General Fitness</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password (Optional)</label>
                <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" value={editData.newPassword || ""} onChange={(e) => setEditData({...editData, newPassword: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98]">
                <Save size={20} /> SAVE CHANGES
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}