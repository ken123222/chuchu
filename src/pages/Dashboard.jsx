import { useEffect, useState, useCallback } from "react";
import axios from "../api/axiosConfig";
import {
  Dumbbell, Flame, Clock, Utensils, Droplet,
  CheckCircle, Zap, ArrowRight, Heart, RefreshCw, Bolt, Loader2, 
  Coffee, Sun, Moon, Apple
} from "lucide-react";
import WaterTracker from "../components/WaterTracker";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// ✅ FIXED: Removed leading /api to prevent /api/api duplication
const API_NUTRITION_URL = '/nutrition';
const API_MEAL_PLANS_URL = '/mealPlans';
const API_AUTH_URL = '/auth/me';
const API_WORKOUTS_SUGGESTED_URL = '/workouts/suggested/for-user';

const calculatePercentage = (current, total) => 
  (total <= 0 || !current) ? 0 : Math.min(100, Math.round((current / total) * 100));

const formatTimeSecondsToHhMm = (totalSeconds) => {
  if (typeof totalSeconds !== 'number' || totalSeconds < 0 || isNaN(totalSeconds)) return '0h 0m';
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const getWorkoutCategoryInfo = (category) => {
  const lowerCategory = category?.toLowerCase() || 'default';
  if (lowerCategory.includes('cardio') || lowerCategory.includes('fat burn'))
    return { icon: Heart, color: 'text-emerald-500', bgColor: 'bg-emerald-50' };
  if (lowerCategory.includes('stretch') || lowerCategory.includes('relax') || lowerCategory.includes('yoga'))
    return { icon: RefreshCw, color: 'text-indigo-500', bgColor: 'bg-indigo-50' };
  if (lowerCategory.includes('hiit') || lowerCategory.includes('full body') || lowerCategory.includes('boxing'))
    return { icon: Bolt, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
  return { icon: Dumbbell, color: 'text-slate-500', bgColor: 'bg-slate-50' };
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [todayMealPlan, setTodayMealPlan] = useState(null);
  const [waterData, setWaterData] = useState({ currentWaterMl: 0, dailyWaterGoalMl: 2500 });
  const [suggestedWorkouts, setSuggestedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleStartWorkout = (workout) => {
    if (workout && workout.id) {
      navigate(`/workout-session/${workout.id}`, { state: workout });
    } else {
      toast.error("Workout data is missing.");
    }
  };

  const logWater = async (amountMl) => {
    if (!token) {
      toast.error("Please log in to track water.");
      return;
    }
    try {
      const newCurrentWaterMl = waterData.currentWaterMl + amountMl;
      await axios.post(
        `${API_NUTRITION_URL}/water`,
        { amountMl, totalMl: newCurrentWaterMl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWaterData(prev => ({ ...prev, currentWaterMl: newCurrentWaterMl }));
      toast.success(`Logged ${amountMl} ml of water!`);
      window.dispatchEvent(new Event("water:updated"));
    } catch (err) {
      console.error("Error logging water:", err);
      toast.error("Failed to log water intake.");
    }
  };

  const fetchWaterData = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_NUTRITION_URL}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWaterData({
        currentWaterMl: response.data.currentWaterMl || 0,
        dailyWaterGoalMl: response.data.dailyWaterGoalMl || 2500
      });
    } catch (err) {
      console.error("Error fetching water data:", err);
    }
  }, [token]);

  const fetchTodayMealPlan = useCallback(async () => {
    if (!token) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await axios.get(API_MEAL_PLANS_URL, {
        params: { date: today },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let rawData = res.data;
      let plan = null;

      if (Array.isArray(rawData)) {
        plan = rawData[0];
      } else {
        plan = rawData.mealPlan || rawData;
      }

      setTodayMealPlan(plan || null);
    } catch (err) {
      console.error("Meal plan fetch error:", err);
      setTodayMealPlan(null);
    }
  }, [token]);

  const fetchNutritionSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_NUTRITION_URL}/today`, { headers: { Authorization: `Bearer ${token}` } });
      setNutritionSummary(res.data || null);
    } catch (err) {
      console.error('Failed to fetch nutrition summary:', err);
      setNutritionSummary(null);
    }
  }, [token]);

  const fetchSuggestedWorkouts = useCallback(async () => {
    if (!token) return;
    try {
      const suggestedRes = await axios.get(API_WORKOUTS_SUGGESTED_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestedWorkouts(suggestedRes.data || []);
    } catch (error) {
      console.error("Failed to fetch suggested workouts:", error);
      setSuggestedWorkouts([]);
    }
  }, [token]);

  const fetchDashboard = useCallback(async () => {
    try {
      if (!token) {
        navigate("/login");
        return;
      }
      setLoading(true);

      const userRes = await axios.get(API_AUTH_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = userRes.data || {};

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const completedToday = (userData.completedWorkouts || []).filter((w) => {
        const wDate = new Date(w.date);
        return wDate >= todayStart;
      });

      const totalTimeTodaySeconds = completedToday.reduce(
        (sum, w) => sum + Number(w.totalTime || 0),
        0
      );

      userData.dashboardStats = {
        workoutsToday: completedToday.length,
        caloriesToday: completedToday.reduce((sum, w) => sum + Number(w.calories || 0), 0),
        totalTimeToday: formatTimeSecondsToHhMm(totalTimeTodaySeconds),
        exercisesToday: completedToday.reduce((sum, w) => sum + (w.completedExercises?.length || 0), 0)
        ,
        achievementsCount: (userData.achievements || []).length || 0
      };

      userData.completedWorkoutsToday = completedToday;
      setUser(userData);

      await Promise.all([fetchTodayMealPlan(), fetchWaterData(), fetchSuggestedWorkouts()]);
        await fetchNutritionSummary();
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate, fetchWaterData, fetchTodayMealPlan, fetchSuggestedWorkouts]);

  useEffect(() => {
    fetchDashboard();
    const refreshDashboard = () => fetchDashboard();
    const refreshWaterData = () => fetchWaterData();

    window.addEventListener("workout:completed", refreshDashboard);
    window.addEventListener("mealplans:updated", refreshDashboard);
    window.addEventListener("notifications:updated", refreshDashboard);
    window.addEventListener("water:updated", refreshWaterData);
    window.addEventListener("nutrition:updated", fetchNutritionSummary);

    return () => {
      window.removeEventListener("workout:completed", refreshDashboard);
      window.removeEventListener("mealplans:updated", refreshDashboard);
      window.removeEventListener("notifications:updated", refreshDashboard);
      window.removeEventListener("water:updated", refreshWaterData);
      window.removeEventListener("nutrition:updated", fetchNutritionSummary);
    };
  }, [fetchDashboard, fetchWaterData]);

  if (loading) return (
    <div className="p-10 flex justify-center items-center h-screen">
      <Loader2 className="animate-spin mr-2 h-6 w-6 text-indigo-600" />
      <span className="text-xl text-indigo-600">Loading dashboard...</span>
    </div>
  );

  if (error) return <div className="p-10 text-red-500">{error}</div>;
  if (!user) return null;

  const stats = user.dashboardStats;
  const waterPercent = calculatePercentage(waterData.currentWaterMl, waterData.dailyWaterGoalMl);
  const waterValue = `${(waterData.currentWaterMl / 1000).toFixed(1)} L (${waterPercent}%)`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pt-28 px-6 max-w-7xl mx-auto pb-20">
        <h1 className="text-3xl font-semibold mb-2">
          Welcome back, {user.fullName || "Fitness Enthusiast"}
        </h1>
        <p className="text-slate-500 mb-10">
          Here’s your fitness progress for today
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Workouts Today" value={stats.workoutsToday} icon={<CheckCircle size={20} />} color="bg-emerald-400" />
          <StatCard label="Calories Burned" value={stats.caloriesToday} icon={<Flame size={20} />} color="bg-orange-400" />
          <StatCard label="Total Time Spent" value={stats.totalTimeToday} icon={<Clock size={20} />} color="bg-blue-400" />
          <StatCard label="Water Intake" value={waterValue} icon={<Droplet size={20} />} color="bg-cyan-400" isWater={true} percentage={waterPercent} />
        </div>

        <div className="mb-6">
          <Section title="Active Meal Plan" icon={<Zap size={18} className="text-amber-500" />}>
            {todayMealPlan ? (
              <MealPlanBreakdownView plan={todayMealPlan} navigate={navigate} />
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Utensils className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-500 mb-4">No active meal plan generated for today.</p>
                <button 
                  onClick={() => navigate("/meal-planner")}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                >
                  Go to Meal Planner
                </button>
              </div>
            )}
          </Section>
        </div>

        <div className="mb-12">
          <Section title="Hydration" icon={<Droplet size={18} />}>
            <div className="w-full">
              <WaterTracker waterData={waterData} logWater={async (amount) => {
                await logWater(amount);
                // create a lightweight notification so Notifications stats update from DB
                try {
                  const token = localStorage.getItem('token');
                  if (token) {
                    await axios.post('/notifications', {
                      category: 'water',
                      title: 'Water Logged',
                      message: `You logged ${amount} ml of water`,
                      priority: 'low'
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    window.dispatchEvent(new Event('notifications:updated'));
                  }
                } catch (e) {
                  console.error('Failed to create water notification:', e);
                }
              }} />
            </div>
          </Section>
        </div>

        <Section
          title="Suggested Workouts"
          icon={<Dumbbell size={18} />}
          actionButton={
            <button
              onClick={() => navigate("/workouts")}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
            >
              See All <ArrowRight size={16} />
            </button>
          }
        >
          <SuggestedWorkoutCards workouts={suggestedWorkouts} handleStartWorkout={handleStartWorkout} />
        </Section>

        <Section title="Completed Workouts Today" icon={<CheckCircle size={18} />}>
          {user.completedWorkoutsToday?.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {user.completedWorkoutsToday.map((w, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col gap-2 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{w.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        w.intensity === "High"
                          ? "bg-red-100 text-red-600"
                          : w.intensity === "Medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {w.intensity || "Medium"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{formatTimeSecondsToHhMm(w.totalTime)}</span>
                    <span>{w.calories || 0} cal</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No workouts completed yet</p>
          )}
        </Section>
      </div>
    </div>
  );
}

// Sub-components
const MealPlanBreakdownView = ({ plan, navigate }) => {
  const mealOrder = [
    { title: "Breakfast", icon: <Coffee size={18} />, color: "bg-orange-50 text-orange-600" },
    { title: "Lunch", icon: <Sun size={18} />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Dinner", icon: <Moon size={18} />, color: "bg-indigo-50 text-indigo-600" },
    { title: "Snacks", icon: <Apple size={18} />, color: "bg-rose-50 text-rose-600" }
  ];
  
  const getItems = (title) => {
    const meals = plan.meals || plan;
    return meals[title] || meals[title.toLowerCase()] || [];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {plan.name || 'Daily Nutrition Plan'}
          </h3>
          <p className="text-slate-500 font-medium mt-1">
            {plan.date ? new Date(plan.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Today's Schedule"}
          </p>
        </div>
        <button
          onClick={() => navigate("/meal-planner")}
          className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition text-sm font-bold shadow-sm"
        >
          Edit Planner
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mealOrder.map((meal, index) => (
          <MealBox 
            key={index} 
            title={meal.title} 
            items={getItems(meal.title)} 
            icon={meal.icon}
            themeColor={meal.color}
          />
        ))}
      </div>
    </div>
  );
};

const MealBox = ({ title, items, icon, themeColor }) => (
  <div className="bg-white rounded-2xl p-5 transition-all duration-300 hover:shadow-md border border-slate-100 flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${themeColor} shadow-sm flex items-center justify-center`}>{icon}</div>
      <div className="flex flex-col">
        <h3 className="font-bold text-slate-800 text-lg leading-none">{title}</h3>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
    </div>

    <div className="space-y-3 grow">
      {items.length > 0 ? (
        items.map((item, i) => (
          <div key={i} className="group cursor-default py-2 last:pb-0">
            <p className="font-semibold text-slate-700 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
              {item.name || item.foodName}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Flame size={12} />
                <span>{item.calories || 0} cal</span>
              </div>
              <div className="flex items-center gap-1">
                <Bolt size={12} />
                <span>{item.protein || 0}g protein</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-8 opacity-40">
          <Utensils size={24} className="text-slate-300 mb-2" />
          <p className="text-xs text-slate-400 font-medium italic">No items</p>
        </div>
      )}
    </div>
  </div>
);

const SuggestedWorkoutCards = ({ workouts, handleStartWorkout }) => {
  if (!workouts.length)
    return (
      <div className="text-slate-500 text-center py-8 bg-gray-50 rounded-lg">
        <Dumbbell size={30} className="mx-auto mb-3 text-slate-400" />
        <p>No workout suggestions available.</p>
      </div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {workouts.map((w, i) => {
        const { icon: Icon, color, bgColor } = getWorkoutCategoryInfo(w.category);
        return (
          <div
            key={w.id || i}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-indigo-300 cursor-pointer"
            onClick={() => handleStartWorkout(w)}
          >
            <div className="mb-4">
              <div className={`p-2 rounded-full inline-block ${bgColor} ${color} mb-3`}>
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 capitalize">{w.name || w.category}</h3>
              <p className="text-sm text-slate-500 mt-1 h-10 overflow-hidden">{w.description || 'A quick, effective session.'}</p>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600 pt-4 border-t border-slate-100">
              <div className="flex gap-2 text-sm text-slate-500">
                <span>{w.level || w.intensity || 'All Levels'}</span>
                <span className="text-slate-300">|</span>
                <span>{w.duration || w.total_duration_minutes || 10} min</span>
              </div>
              <span className="flex items-center font-semibold text-emerald-500">
                Start <ArrowRight size={16} className="ml-1" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EmptyFoodLogCTA = ({ navigate }) => (
  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex flex-col justify-center items-center h-full min-h-[300px] text-center">
    <Utensils size={40} className="text-indigo-300 mb-4" />
    <h2 className="text-xl font-bold text-indigo-800 mb-2">Manual Nutrition Log</h2>
    <p className="text-indigo-600 mb-6 max-w-xs">
      Don't have a plan? Log your individual meals here to track your daily intake.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <button
        onClick={() => navigate("/meal-planner")}
        className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:bg-emerald-600 transition duration-200"
      >
        Open Planner
      </button>
      <button
        onClick={() => toast.success("Manual log opening...")}
        className="px-6 py-3 bg-white border border-indigo-200 text-indigo-600 font-semibold rounded-lg shadow-sm hover:bg-indigo-100 transition duration-200"
      >
        Quick Log
      </button>
    </div>
  </div>
);

const WaterLogCard = ({ waterData, waterPercent, logWater }) => {
  const amountToLog = 250;
  return (
    <div className="bg-white border border-cyan-200 rounded-2xl p-8 shadow-xl flex flex-col justify-between h-full min-h-[300px]">
      <div className="flex flex-col items-center mb-6">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-cyan-700">
          <span className="p-2 bg-cyan-50 rounded-lg"><Droplet size={24} className="text-cyan-600" /></span> Hydration
        </h3>
        <div className="relative w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center overflow-hidden mb-4">
          <div className="absolute bottom-0 left-0 w-full bg-cyan-200 transition-all duration-1000" style={{ height: `${waterPercent}%` }}></div>
          <p className="relative text-3xl font-extrabold text-cyan-800">{(waterData.currentWaterMl / 1000).toFixed(1)}L</p>
        </div>
        <p className="text-lg font-medium text-slate-500">Goal: {(waterData.dailyWaterGoalMl / 1000).toFixed(1)} L</p>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
        <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-700" style={{ width: `${waterPercent}%` }}></div>
      </div>
      <button
        onClick={() => logWater(amountToLog)}
        className="w-full py-3 bg-cyan-500 text-white rounded-xl shadow-lg hover:bg-cyan-600 transition flex items-center justify-center gap-2 font-bold text-lg"
      >
        <Droplet size={20} /> Log {amountToLog} ml
      </button>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, isWater = false, percentage = 0 }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-lg">
    <div className={`absolute top-0 left-0 h-1 w-full ${color}`} />
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-semibold mt-1">{value}</p>
      </div>
      <div className="p-3 bg-slate-100 rounded-xl">{icon}</div>
    </div>
    {isWater && (
      <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${percentage}%` }}></div>
        <p className="text-xs text-slate-500 mt-1 text-right">{percentage}% goal met</p>
      </div>
    )}
  </div>
);

const Section = ({ title, icon, children, actionButton }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-8 mb-12 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}<h2 className="font-semibold text-xl">{title}</h2>
      </div>
      {actionButton}
    </div>
    {children}
  </div>
);

const NutritionSummaryCard = ({ summary, navigate }) => {
  const calories = summary.currentCalories ?? summary.currentCaloriesConsumed ?? 0;
  const protein = summary.currentProtein ?? 0;
  const carbs = summary.currentCarbs ?? 0;

  const dailyFoods = summary.dailyFoodLog || summary.dailyFoods || summary.foods || [];

  // Use last logged meal type saved by Diet page to auto-filter (if present)
  const lastLoggedMealType = (() => {
    try { return (localStorage.getItem('lastLoggedMealType') || 'all').toLowerCase(); } catch (e) { return 'all'; }
  })();

  const selectedMealType = lastLoggedMealType || 'all';
  const displayedFoods = selectedMealType === 'all'
    ? dailyFoods
    : dailyFoods.filter((f) => ((f.mealType || f.meal_type || f.type || '') + '').toLowerCase() === selectedMealType);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col">
      <div>
        <h3 className="text-xl font-bold mb-2">Today — Nutrition Snapshot</h3>
        <p className="text-sm text-slate-500 mb-4">Quick view of today's logged nutrition from your Meal Plan and Manual Logs.</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-sm text-orange-600 font-semibold">Calories</p>
            <p className="text-2xl font-bold text-orange-700 mt-2">{Math.round(calories)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600 font-semibold">Protein</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">{Math.round(protein)}g</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 font-semibold">Carbs</p>
            <p className="text-2xl font-bold text-green-700 mt-2">{Math.round(carbs)}g</p>
          </div>
        </div>

        <div className="mt-4">
          {displayedFoods.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No logged foods for the recent meal type.</p>
          ) : (
            <div className="space-y-3 max-h-44 overflow-y-auto pr-2 mt-2">
              {displayedFoods.map((f, i) => (
                <div key={f.id || f._id || i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{f.name || f.foodName || 'Food'}</p>
                    <p className="text-xs text-slate-500">{(f.mealType || f.meal_type || f.type || '').toString().charAt(0).toUpperCase() + (f.mealType || f.meal_type || f.type || '').toString().slice(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{Math.round(f.calories || 0)} cal</p>
                    <p className="text-xs text-slate-500">{Math.round(f.protein || 0)}g protein</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => navigate('/meal-planner')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold">Open Planner</button>
        <button onClick={() => navigate('/meal-planner')} className="py-3 px-4 bg-white border rounded-xl">Open Planner</button>
      </div>
    </div>
  );
};

