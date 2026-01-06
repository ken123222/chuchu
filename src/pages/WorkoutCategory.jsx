import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import { ArrowLeft, Clock, Flame, Zap, ChevronRight } from "lucide-react";

export default function WorkoutCategory() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/workouts/${category}`);
        setWorkouts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch workouts:", err);
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [category]);

  const getIntensityDisplay = (intensity) => {
    const lowerCaseInt = intensity?.toLowerCase();
    switch (lowerCaseInt) {
      case "high":
        return { text: "High Intensity", color: "text-rose-500", bg: "bg-rose-50" };
      case "low":
        return { text: "Low Intensity", color: "text-emerald-600", bg: "bg-emerald-50" };
      default:
        return { text: "Moderate", color: "text-amber-600", bg: "bg-amber-50" };
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (error) return <div className="p-6 text-rose-600 bg-white min-h-screen font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pt-16 px-6 pb-12 max-w-7xl mx-auto">
        
        {/* HEADER SECTION: Centered */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate("/workouts")}
            className="group text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 justify-center mb-6 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Library
          </button>
          <h1 className="text-4xl md:text-5xl font-black capitalize text-slate-900 tracking-tighter mb-4">
            {category}<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mx-auto max-w-2xl">
            Professional routines curated for your progress.
          </p>
        </div>

        <div className="flex justify-center items-center mb-8">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-700 font-black text-xs uppercase tracking-widest">{workouts.length} Sessions Available</span>
          </div>
        </div>

        {/* WORKOUT CARDS GRID */}
        {workouts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-bold">No sessions found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {workouts.map((w) => {
              const intensityData = getIntensityDisplay(w.intensity);

              return (
                <div
                  key={w._id || w.id || w.name}
                  className="group bg-white rounded-[1.5rem] p-6 shadow-lg shadow-slate-200/50 border border-transparent hover:border-emerald-100 transition-all duration-300 flex flex-col"
                >
                  {/* Top Row: Intensity Tag */}
                  <div className="mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${intensityData.bg} ${intensityData.color} border-current/10`}>
                      {intensityData.text}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-500 transition-colors duration-300">
                    {w.name}
                  </h2>
                  <p className="text-slate-400 text-sm font-medium mb-6 flex-grow line-clamp-2">
                    {w.description || `Optimized ${w.intensity?.toLowerCase()} routine for maximum efficiency.`}
                  </p>

                  {/* STATS Bar: Matches WorkoutSession layout */}
                  <div className="grid grid-cols-3 gap-4 py-4 px-2 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                    <div className="flex flex-col items-center justify-center border-r border-slate-200">
                      <Clock size={16} className="text-slate-400 mb-1" />
                      <span className="font-black text-xs text-slate-700">{w.total_duration_minutes || 0}m</span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-r border-slate-200">
                      <Flame size={16} className="text-orange-500 mb-1" />
                      <span className="font-black text-xs text-slate-700">{w.calories_burned || 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <Zap size={16} className="text-emerald-500 mb-1" />
                      <span className="font-black text-xs text-slate-700">{(w.exercises || []).length}</span>
                    </div>
                  </div>

                  {/* START BUTTON */}
                  <button
                    onClick={() => navigate(`/workout-session/${w._id}`, { state: w })}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-emerald-200 active:scale-[0.98]"
                  >
                    Start Session
                    <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
