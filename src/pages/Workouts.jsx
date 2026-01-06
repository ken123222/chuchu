import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import {
  Heart,
  Repeat,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Workout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        setError("Unable to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  const workoutCategories = [
    {
      name: "Cardio",
      description: "High-intensity sessions to build endurance and burn fat.",
      icon: Heart,
      route: "/workout/category/cardio",
      color: "rose",
    },
    {
      name: "Stretch",
      description: "Improve flexibility and restore mobility after training.",
      icon: Repeat,
      route: "/workout/category/stretch",
      color: "emerald",
    },
    {
      name: "Relax",
      description: "Breathing techniques and recovery to calm the mind.",
      icon: Activity,
      route: "/workout/category/relax",
      color: "cyan",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pt-16 px-6 pb-10 max-w-6xl mx-auto">
        
        {/* HEADER: Centered & High Contrast */}
        <div className="mb-12 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-4">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Daily Training</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-3">
            Today’s Workouts<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Carefully designed sessions to help you train, recover, and reset.
          </p>
        </div>

        {/* CATEGORY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workoutCategories.map((cat, idx) => {
            const Icon = cat.icon;

            return (
              <button
                key={idx}
                onClick={() => navigate(cat.route)}
                className="group relative flex flex-col"
              >
                <div className="h-full rounded-[1.5rem] bg-white p-8 shadow-lg shadow-slate-200/50 border border-transparent group-hover:border-emerald-100 transition-all duration-500 flex flex-col items-start text-left">
                  
                  {/* Icon Box */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={28} className="text-slate-800" />
                  </div>

                  {/* Text Content */}
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-3 group-hover:text-emerald-500 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-slate-400 font-bold text-sm leading-relaxed mb-6">
                    {cat.description}
                  </p>

                  {/* Footer Meta */}
                  <div className="mt-auto w-full pt-5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Level</span>
                      <span className="text-xs font-black text-slate-700">BEGINNER</span>
                    </div>
                    
                    {/* Circle Arrow (Matches Session Style) */}
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-emerald-500 transition-all duration-300 shadow-lg shadow-slate-200 group-hover:shadow-emerald-200">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
