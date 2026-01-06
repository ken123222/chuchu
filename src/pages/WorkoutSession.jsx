import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../api/axiosConfig";
import { Play, Pause, SkipForward, XCircle, Timer, Award } from "lucide-react";

const BREAK_DURATION = 15; 
const COUNTDOWN_DURATION = 3; 
const DEFAULT_EXERCISE_DURATION = 180; 

export default function WorkoutSession() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [workout, setWorkout] = useState(state || null);
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [started, setStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);

  const [completedExercises, setCompletedExercises] = useState([]);
  const [exerciseTimes, setExerciseTimes] = useState([]); 
  const [totalTime, setTotalTime] = useState(0);
  const STORAGE_KEY = `fit_active_workout`;

  // --- NAVIGATION GUARD LOGIC (UNTOUCHED) ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (started) {
        const message = "A workout is in progress. Do you want to continue workout or leave?";
        e.preventDefault();
        e.returnValue = message; 
        return message;
      }
    };
    const handlePopState = (e) => {
      if (started) {
        const confirmLeave = window.confirm("Workout in progress! Click 'Cancel' to stay, or 'OK' to leave and lose progress.");
        if (!confirmLeave) {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [started]);

  const safeNavigate = (path) => {
    if (started) {
      const confirmLeave = window.confirm("Do you want to continue workout or leave? Clicking OK will end your session.");
      if (confirmLeave) navigate(path);
    } else {
      navigate(path);
    }
  };

  // --- TIME HELPERS ---
  const getDurationSeconds = (ex) => {
    const dur = Number(ex?.duration);
    return !isNaN(dur) && dur > 0 ? dur : DEFAULT_EXERCISE_DURATION; 
  };

  const formatTime = (s) => {
    const seconds = Number(s) || 0;
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  
  const startCountdown = () => {
    setIsRunning(false);
    setIsCountdown(true);
    setCountdown(COUNTDOWN_DURATION);
  };

  const handleEndWorkout = useCallback((finalExercise) => {
    setIsRunning(false);
    setIsCountdown(false);
    setStarted(false); 
    const finalCompleted = [...completedExercises, finalExercise].filter(Boolean);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    navigate("/workout-complete", {
      state: { workout, completedExercises: finalCompleted, exerciseTimes: exerciseTimes.slice(0, (workout?.exercises?.length || 0)), totalTime },
    });
    window.dispatchEvent(new Event("workout:completed"));
  }, [navigate, workout, completedExercises, exerciseTimes, totalTime, STORAGE_KEY]);

  const handleNext = useCallback(() => {
    if (!workout || workout.exercises.length === 0) return;
    const current = workout.exercises[currentIndex];
    const nextIndex = currentIndex + 1;

    if (isBreak) {
      setIsBreak(false);
      if (nextIndex < workout.exercises.length) {
        setCurrentIndex(nextIndex);
        setTimeLeft(getDurationSeconds(workout.exercises[nextIndex])); 
        startCountdown();
      } else { handleEndWorkout(current); }
      return;
    }

    setCompletedExercises((prev) => [...prev, current]);
    if (nextIndex < workout.exercises.length) {
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
      setIsRunning(true);
    } else { handleEndWorkout(current); }
  }, [workout, currentIndex, isBreak, handleEndWorkout]);

  const handleStartWorkout = () => {
    setStarted(true);
    startCountdown();
  };

  // Persistence Logic
  useEffect(() => {
    const save = () => {
      if (!workout) return;
      const snapshot = {
        id: workout.id || workout._id || id,
        currentIndex, timeLeft, started, isRunning, isBreak, isCountdown,
        countdown, completedExercises, exerciseTimes, totalTime, timestamp: Date.now(),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch (e) {}
    };
    save();
  }, [workout, currentIndex, timeLeft, started, isRunning, isBreak, isCountdown, countdown, completedExercises, exerciseTimes, totalTime, id, STORAGE_KEY]);

  // Initialization
  useEffect(() => {
    if (workout) {
      if (workout.exercises && workout.exercises.length > 0 && !started) {
        setTimeLeft(getDurationSeconds(workout.exercises[0]));
      }
      return;
    }
    const fetchWorkout = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/workouts/id/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data;
        data.exercises = (data.exercises || []).map((ex) => ({ ...ex, duration: getDurationSeconds(ex) }));
        setWorkout(data);
        if (data.exercises.length > 0) setTimeLeft(data.exercises[0].duration);
      } catch (err) { setError("Workout not found."); }
      finally { setLoading(false); }
    };
    if (token) fetchWorkout();
  }, [id, workout, token, started]);

  // Timer Effect
  useEffect(() => {
    if (!isRunning || isCountdown) return;
    if (timeLeft <= 0) { handleNext(); return; }
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
      setTotalTime((t) => t + 1);
      if (!isBreak) {
        setExerciseTimes((prev) => {
          const newTimes = [...prev];
          newTimes[currentIndex] = (newTimes[currentIndex] || 0) + 1;
          return newTimes;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isCountdown, isBreak, currentIndex, handleNext]);

  // Countdown Effect
  useEffect(() => {
    if (!isCountdown) return;
    if (countdown <= 0) { setIsCountdown(false); setIsRunning(true); return; }
    const timer = setInterval(() => setCountdown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isCountdown, countdown]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (!workout) return null;

  const currentExercise = workout.exercises[currentIndex];
  const nextIndex = currentIndex + 1;
  const overallProgress = (completedExercises.length / workout.exercises.length) * 100;
  
  const currentMaxDuration = isBreak ? BREAK_DURATION : getDurationSeconds(currentExercise);
  const circleProgress = currentMaxDuration > 0 ? (timeLeft / currentMaxDuration) : 0;

  // Next Duration Logic
  const nextExercise = workout.exercises[nextIndex];
  const targetTimeValue = isBreak 
    ? (nextExercise ? getDurationSeconds(nextExercise) : 0) 
    : BREAK_DURATION;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* FRAME WIDTH: max-w-2xl keeps it wide. Reduced padding to p-6 for a tighter fit */}
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col">
        
        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* HEADER (Reduced margin-bottom) */}
          <div className="text-center mb-6 w-full">
            <span className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
              Exercise {currentIndex + 1} of {workout.exercises.length}
            </span>
            <h2 className="text-2xl font-black text-slate-800 mt-2 line-clamp-1">{workout.name}</h2>
          </div>

          {/* MAIN CIRCLE TIMER (Resized from w-80 to w-64) */}
          <div className="relative flex justify-center items-center mb-6">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle cx="128" cy="128" r="118" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
              <circle 
                cx="128" cy="128" r="118" stroke="currentColor" strokeWidth="10" fill="transparent"
                strokeDasharray={741}
                strokeDashoffset={741 * (1 - circleProgress)}
                strokeLinecap="round"
                className={`${isBreak ? 'text-amber-400' : 'text-emerald-500'} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-6xl font-black text-slate-800 font-mono tracking-tighter">
                {isCountdown ? countdown : formatTime(timeLeft)}
              </span>
              <span className={`text-[10px] font-bold uppercase mt-1 tracking-[0.2em] ${isBreak ? 'text-amber-500' : 'text-slate-400'}`}>
                {isCountdown ? "Get Ready" : isBreak ? "Rest Time" : "Work Time"}
              </span>
            </div>
          </div>

          {/* EXERCISE INFO CARD (Reduced padding and margins) */}
          <div className={`w-full rounded-[1.5rem] p-5 mb-6 border transition-all duration-300 ${isBreak ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-sm ${isBreak ? 'bg-white text-amber-500' : 'bg-white text-emerald-500'}`}>
                  {isBreak ? <Timer size={24} /> : <Award size={24} />}
                </div>
                <div>
                  <h4 className="text-slate-800 font-black text-lg">
                    {isBreak ? "Next Up" : currentExercise.name}
                  </h4>
                  <p className="text-slate-500 text-xs font-bold">
                    {isBreak ? (nextExercise?.name || "Finish!") : "Push your limits!"}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    {isBreak ? "Next Duration" : "Next Rest"}
                </p>
                <p className="text-slate-800 font-mono font-bold text-lg">
                  {formatTime(targetTimeValue)}
                </p>
              </div>
            </div>
          </div>

          {/* CONTROLS (Reduced spacing) */}
          <div className="w-full space-y-3">
            {!started ? (
              <button onClick={handleStartWorkout} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-3 text-lg">
                <Play size={20} fill="currentColor" /> START WORKOUT
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsRunning(!isRunning)} 
                  disabled={isCountdown}
                  className={`py-4 rounded-2xl font-black transition flex items-center justify-center gap-2 text-md ${isRunning ? 'bg-slate-800 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md'}`}
                >
                  {isRunning ? <><Pause size={20} fill="currentColor" /> PAUSE</> : <><Play size={20} fill="currentColor" /> RESUME</>}
                </button>
                <button 
                  onClick={handleNext} 
                  disabled={isCountdown}
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 py-4 rounded-2xl font-black transition flex items-center justify-center gap-2 text-md"
                >
                  <SkipForward size={20} /> SKIP
                </button>
              </div>
            )}

            <button 
              onClick={() => safeNavigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition pt-2"
            >
              <XCircle size={14} /> Quit Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}