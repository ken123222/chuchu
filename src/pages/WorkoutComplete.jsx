import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import axios from "../api/axiosConfig";
import { Toaster, toast } from "react-hot-toast"; 

export default function WorkoutComplete() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    if (!state) return (<div className="text-center p-6 text-lg">No workout data available.</div>);

    const { workout = {}, completedExercises = [], exerciseTimes = [], totalTime = 0 } = state;

    const [userWeightKg, setUserWeightKg] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchMe = async () => {
            try {
                const res = await axios.get('/auth/me');
                if (mounted && res?.data) setUserWeightKg(res.data.weightKg ?? res.data.weight ?? null);
            } catch (e) {
                // silently ignore; weight is optional
            }
        };
        fetchMe();
        return () => { mounted = false };
    }, []);

    const calcCaloriesForExercise = (ex, timeSeconds) => {
        const secs = Number(timeSeconds) || 0;

        if (ex.caloriesPerSecond != null) return secs * Number(ex.caloriesPerSecond);
        if (ex.caloriesPerMinute != null) return (secs / 60) * Number(ex.caloriesPerMinute);

        // MET-based calculation: kcal = MET * weightKg * hours
        if (ex.met != null && (userWeightKg != null)) {
            return Number(ex.met) * Number(userWeightKg) * (secs / 3600);
        }

        // If exercise provides MET but user weight is unknown, assume 70kg
        if (ex.met != null) return Number(ex.met) * 70 * (secs / 3600);

        // Fallback to workout intensity -> map to a reasonable MET
        const intensity = (ex.intensity || workout.intensity || '').toString().toLowerCase();
        const intensityMetMap = { low: 3, medium: 6, high: 8 };
        if (intensity && intensityMetMap[intensity]) {
            const met = intensityMetMap[intensity];
            const weight = userWeightKg ?? 70;
            return met * weight * (secs / 3600);
        }

        // Final fallback: small per-second value (approx 7 kcal/min)
        return secs * 0.12;
    };

    // Calculate calories per exercise (memoized)
    const exerciseCalories = useMemo(() => {
        return completedExercises.map((ex, idx) => {
            const timeSpent = exerciseTimes[idx] ?? ex.duration ?? 0;
            return calcCaloriesForExercise(ex, timeSpent);
        });
    }, [completedExercises, exerciseTimes, userWeightKg, workout.intensity]);

    const totalCalories = Math.round(exerciseCalories.reduce((acc, val) => acc + val, 0));
    const completion = Math.round((completedExercises.length / (workout.exercises?.length || 1)) * 100);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "0m 0s";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const handleSaveWorkout = async () => {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        // 🎯 FIX: Aligning payload with User Model schema
        const payload = {
            workoutId: workout._id,
            name: workout.name || "Completed Workout",
            calories: totalCalories,
            totalTime, // Matches your 'totalTime' field in UserSchema
            completedExercises: completedExercises.map((ex, idx) => ({
                id: ex._id || ex.id,
                name: ex.name,
                timeSpent: exerciseTimes[idx] || 0,
                calories: Math.round(exerciseCalories[idx] || 0)
            })),
        };

        try {
            setSaving(true);
            // 🎯 IMPROVEMENT: Using the axios instance automatically handles the base URL
            await axios.post("/workouts/complete", payload);

            // 📢 Create workout completion notification
            try {
                await axios.post("/notifications", {
                    category: "workout",
                    title: "Workout Completed!",
                    message: `You completed ${workout.name} and burned ${totalCalories} calories!`,
                    priority: "medium",
                    action: { type: "view-stats", value: workout._id }
                });
                window.dispatchEvent(new Event('notifications:updated'));
            } catch (notifErr) {
                console.error("Failed to create notification:", notifErr);
                // Don't stop the flow if notification fails
            }

            // 🎖️ Create an achievement notification (frontend-level) and notify listeners
            try {
                await axios.post("/notifications", {
                    category: "achievement",
                    title: "Achievement Unlocked!",
                    message: `You earned an achievement for completing ${workout.name}!`,
                    priority: "low"
                });
                window.dispatchEvent(new Event('notifications:updated'));
            } catch (achErr) {
                console.error('Failed to post achievement notification:', achErr);
            }

            toast.success("Workout saved successfully!");
            window.dispatchEvent(new Event("workout:completed"));
            // notify nutrition/diet views to refresh if they depend on workout completion
            window.dispatchEvent(new Event('nutrition:updated'));
            
            // Give the user a moment to see the success message
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (err) {
            console.error("Failed to save workout:", err.response?.data || err);
            toast.error(err.response?.data?.message || "Failed to save workout");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 flex flex-col items-center justify-center p-10">
            <Toaster position="top-right" />
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-8 flex flex-col gap-12">
                
                {/* HEADER */}
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Workout Complete!</h1>
                    <p className="text-lg text-gray-600 mt-2">Great job! You're one step closer to your goals! 🏆</p>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <StatCard label="Total Time" value={formatTime(totalTime)} color="bg-blue-100" />
                    <StatCard label="Exercises Completed" value={completedExercises.length} color="bg-green-100" />
                    <StatCard label="Calories Burned" value={totalCalories} color="bg-orange-100" />
                    <StatCard label="Completion %" value={`${completion}%`} color="bg-purple-100" />
                </div>

                {/* EXERCISES DETAILS */}
                <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
                    <h2 className="text-3xl font-semibold text-gray-900 mb-6">{workout.name}</h2>
                    <span className="text-sm bg-gray-200 text-gray-800 px-4 py-2 rounded-full">{workout.intensity ?? "Medium Intensity"}</span>

                    <div className="mt-8">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Exercises Completed:</h3>
                        <div className="space-y-6">
                            {completedExercises.map((ex, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 flex justify-between items-center shadow-sm hover:bg-gray-50 transition-all">
                                    <span className="text-xl text-gray-900">{ex.name}</span>
                                    <span className="text-sm text-gray-500">
                                        {formatTime(exerciseTimes[idx] ?? ex.duration ?? 0)} / {Math.round(exerciseCalories[idx] || 0)} cal
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ACTION BUTTON */}
                <button
                    onClick={handleSaveWorkout}
                    disabled={saving}
                    className={`w-full py-5 rounded-xl text-white font-bold text-lg shadow-lg ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"} transition-all duration-300`}
                >
                    {saving ? "Saving your progress..." : "Save & Return to Dashboard"}
                </button>
            </div>
        </div>
    );
}

const StatCard = ({ label, value, color }) => (
    <div className={`rounded-2xl p-6 text-center shadow-xl ${color}`}>
        <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
);