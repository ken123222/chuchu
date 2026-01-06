import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import axios from '../api/axiosConfig';
import { Flame, Utensils, Droplet, CheckCircle, Plus, Users, Bolt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = '/nutrition'; 
const API_MEALPLANS_URL = '/mealPlans'; 
const WATER_CUP_SIZE_ML = 250; 

// Helper to safely divide and prevent NaN or Infinity
const calculatePercentage = (current, total) => {
    if (total <= 0 || !current) return 0;
    return Math.min(100, Math.round((current / total) * 100));
};

// ----------------------------------------------------------------------------------
// CORE COMPONENT
// ----------------------------------------------------------------------------------

export default function Diet() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nutritionData, setNutritionData] = useState({
        currentCalories: 0,
        maxCalories: 2200,
        currentProtein: 0,
        maxProtein: 150,
        currentCarbs: 0,
        maxCarbs: 250,
        currentWaterMl: 0,
        dailyWaterGoalMl: 2500,
        foodLog: [] 
    });
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [externalMeals, setExternalMeals] = useState([]);
    const [externalModalOpen, setExternalModalOpen] = useState(false);

    // Helper to map meal plan items to foodLog format
    const mapMealPlanToFoodLog = (mealPlan) => {
        if (!mealPlan || !mealPlan.meals) return [];

        const log = [];
        const mealTypes = {
            breakfast: "Breakfast",
            lunch: "Lunch",
            dinner: "Dinner",
            snacks: "Snack"
        };

        Object.entries(mealPlan.meals).forEach(([mealKey, mealItems]) => {
            const mealTypeTitle = mealTypes[mealKey] || 'Meal';
            
            if (Array.isArray(mealItems)) {
                mealItems.forEach(item => {
                    log.push({
                        name: item.name || 'Logged Item',
                        time: item.time || mealTypeTitle, 
                        calories: item.calories || 0,
                        protein: item.protein || 0,
                        carbs: item.carbs || 0,
                        type: mealTypeTitle, 
                        isPlanned: true, 
                    });
                });
            }
        });

        const order = ["Breakfast", "Snack", "Lunch", "Dinner"];
        return log.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    };

    // ---------------- API FETCH FUNCTION ----------------
    const fetchNutritionData = useCallback(async () => {
        if (!token) {
            navigate("/login");
            return;
        }
        
        try {
            setLoading(true);
            
            const [nutritionRes, mealPlanRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/today`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_MEALPLANS_URL}/today`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => {
                    if (err.response?.status !== 404) throw err;
                    return { data: null };
                }) 
            ]);

            const fetchedNutrition = nutritionRes.data || {};
            const todayMealPlan = mealPlanRes.data || null;

            const plannedFoodLog = mapMealPlanToFoodLog(todayMealPlan);
            
            const combinedFoodLog = [
                ...plannedFoodLog, 
                ...(fetchedNutrition.foodLog || []).filter(item => !item.isPlanned) 
            ];
            
            setNutritionData(prev => ({
                ...prev,
                ...fetchedNutrition,
                foodLog: combinedFoodLog
            }));

        } catch (err) {
            console.error("Error fetching nutrition data:", err);
            if (err.response?.status !== 404) {
                 setError("Failed to load nutrition data. Please check your network and backend configuration.");
            }
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    // ---------------- API UPDATE FUNCTION: WATER ----------------
    const updateWaterIntake = async (amountToLogMl, finalNewTotalMl) => {
        try {
            if (!token) return navigate("/login");
            if (amountToLogMl === 0) return; 

            setNutritionData(prev => ({
                ...prev,
                currentWaterMl: finalNewTotalMl 
            }));

            await axios.post(`${API_BASE_URL}/water`, { 
                amountMl: amountToLogMl 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            window.dispatchEvent(new Event('water:updated')); 

        } catch (err) {
            console.error("Failed to update water intake:", err);
            setError("Water update failed. Retrying sync...");
            fetchNutritionData(); 
        }
    };

    // ---------------- EVENT HANDLERS ----------------
    const handleWaterGlassClick = (cupIndex) => {
        const currentWaterMl = nutritionData.currentWaterMl;
        const currentCups = Math.floor(currentWaterMl / WATER_CUP_SIZE_ML);
        
        let newCups;
        if (cupIndex + 1 === currentCups) {
             newCups = currentCups - 1;
        } else {
             newCups = cupIndex + 1;
        }

        newCups = Math.max(0, newCups);
        const newTotalWaterMl = newCups * WATER_CUP_SIZE_ML;
        const amountToLog = newTotalWaterMl - currentWaterMl; 

        if (amountToLog !== 0) {
             updateWaterIntake(amountToLog, newTotalWaterMl);
        }
    };

    const handleNewLogFoodClick = () => {
        setExternalModalOpen(true);
    };

    // ---------------- CALCULATED VALUES & MEMOIZED STATS ----------------
    const MAX_WATER_CUPS = Math.ceil(nutritionData.dailyWaterGoalMl / WATER_CUP_SIZE_ML);
    const waterCupsFilled = Math.floor(nutritionData.currentWaterMl / WATER_CUP_SIZE_ML);

    const nutritionStats = useMemo(() => [
        { 
            label: "Calories", unit: "kcal", max: nutritionData.maxCalories, current: nutritionData.currentCalories, 
            icon: Flame, color: "bg-orange-100 text-orange-600", barColor: "bg-orange-400" 
        },
        { 
            label: "Protein", unit: "g", max: nutritionData.maxProtein, current: nutritionData.currentProtein, 
            icon: Users, color: "bg-blue-100 text-blue-600", barColor: "bg-blue-400" 
        },
        { 
            label: "Carbs", unit: "g", max: nutritionData.maxCarbs, current: nutritionData.currentCarbs, 
            icon: Bolt, color: "bg-green-100 text-green-600", barColor: "bg-green-400" 
        },
        { 
            label: "Water", unit: "L", max: nutritionData.dailyWaterGoalMl / 1000, current: nutritionData.currentWaterMl / 1000, 
            icon: Droplet, color: "bg-cyan-100 text-cyan-600", barColor: "bg-cyan-400" 
        },
    ], [nutritionData]);

    // ---------------- USE EFFECT ----------------
    useEffect(() => {
        fetchNutritionData();

        // fetch external meals once - directly from Firebase URLs
        const fetchExternal = async () => {
            try {
                const firebaseUrls = [
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal1.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal2.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal3.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal4.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal5.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal6.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal7.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal8.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal9.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal10.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal11.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal12.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal13.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal14.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal15.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal16.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal17.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal18.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal19.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal20.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal21.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal22.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal23.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal24.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal25.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal26.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal27.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal28.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal29.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal30.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal31.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal32.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal33.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal34.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal35.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal36.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal37.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal38.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal39.json",
                    "https://api-qa-web-b0d73-default-rtdb.firebaseio.com/meals/meal40.json",
                ];
                const promises = firebaseUrls.map((u) => fetch(u).then(r => r.json()).catch(() => null));
                const results = await Promise.all(promises);
                const normalized = results.filter(Boolean).map((m, idx) => ({
                    id: m?.id || `meal${idx+1}`,
                    name: m?.name || m?.title || `Meal ${idx+1}`,
                    description: m?.description || m?.desc || '',
                    calories: m?.calories || m?.cal || 0,
                    protein: m?.protein || 0,
                    carbs: m?.carbs || 0,
                    prep_time: m?.prep_time || m?.prepTime || 0,
                    servings: m?.servings || 1,
                    tags: m?.tags || [],
                }));
                setExternalMeals(normalized);
            } catch (err) {
                console.error('Failed to fetch external meals:', err);
            }
        };
        fetchExternal();

        const refreshListener = () => fetchNutritionData();
        window.addEventListener('water:updated', refreshListener);
        window.addEventListener('mealplans:updated', refreshListener);
        window.addEventListener('nutrition:updated', refreshListener);

        return () => {
            window.removeEventListener('water:updated', refreshListener);
            window.removeEventListener('mealplans:updated', refreshListener);
            window.removeEventListener('nutrition:updated', refreshListener);
        };
    }, [fetchNutritionData, token]);


    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading nutrition data...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster />
            <div className="pt-28 px-6 max-w-7xl mx-auto pb-12">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Nutrition Tracking</h1>
                        <p className="text-slate-500">Monitor your daily nutrition and stay on track</p>
                    </div>
                    <button
                        onClick={handleNewLogFoodClick}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Plus size={20} /> New Log Food
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-2">
                         <Bolt size={18} /> {error}
                    </div>
                )}

                {externalModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl p-8 relative">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Add Food Entry</h2>
                                    <p className="text-slate-500 text-sm mt-1">Choose from recommended recipes or add custom food with nutritional information</p>
                                </div>
                                <button type="button" onClick={() => setExternalModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-semibold text-slate-700 block mb-2">Meal Type</label>
                                <select id="meal-type-select" className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snacks">Snacks</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                                {externalMeals.length === 0 ? (
                                    <div className="col-span-3 text-center text-slate-400 py-12">
                                        <Utensils size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>Loading meals...</p>
                                    </div>
                                ) : (
                                    externalMeals.map((m) => (
                                        <div key={m.id} className="rounded-xl p-4 bg-slate-50 border border-slate-200 hover:shadow-md transition">
                                            <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{m.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description || 'Nutritious meal'}</p>
                                            
                                            <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Calories</p>
                                                    <p className="font-bold text-slate-900 text-sm">{Math.round(m.calories) || 'N/A'}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Protein</p>
                                                    <p className="font-bold text-slate-900 text-sm">{Math.round(m.protein) || 0}g</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">Carbs</p>
                                                    <p className="font-bold text-slate-900 text-sm">{Math.round(m.carbs) || 0}g</p>
                                                </div>
                                            </div>

                                            {m.tags && m.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {m.tags.slice(0, 2).map((tag, idx) => (
                                                        <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <button onClick={async () => {
                                                if (!token) return navigate('/login');
                                                const mealType = document.getElementById('meal-type-select').value;
                                                try {
                                                    await axios.post('/nutrition/food', {
                                                        name: m.name,
                                                        calories: m.calories || 0,
                                                        protein: m.protein || 0,
                                                        carbs: m.carbs || 0,
                                                        mealType: mealType,
                                                    }, { headers: { Authorization: `Bearer ${token}` } });
                                                    toast.success(`Added to ${mealType}`);
                                                    setExternalModalOpen(false);
                                                    // Remember last logged meal type so dashboard can auto-filter
                                                    try { localStorage.setItem('lastLoggedMealType', mealType); localStorage.setItem('lastLoggedMealTypeAt', String(Date.now())); } catch(e){}
                                                    fetchNutritionData();
                                                    window.dispatchEvent(new Event('nutrition:updated'));
                                                    window.dispatchEvent(new Event('mealplans:updated'));
                                                } catch (err) {
                                                    console.error('Failed to log external meal:', err);
                                                    toast.error('Failed to add meal');
                                                }
                                            }} className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm transition">
                                                + Add to {document.getElementById('meal-type-select')?.value || 'Breakfast'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- STAT CARDS --- */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {nutritionStats.map((stat, index) => (
                        <NutritionStatCard key={index} {...stat} />
                    ))}
                </div>

                {/* --- LOGS & WATER TRACKER --- */}
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* LEFT: TODAY'S FOOD LOG */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-xl text-slate-800">Today's Food Log</h2>
                            <span className="text-sm font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                                {nutritionData.foodLog.length} entries
                            </span>
                        </div>
                        
                        {nutritionData.foodLog.length === 0 ? (
                            <div className="text-center py-16">
                                <Utensils size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-500 italic">No food logged yet. Create a Meal Plan or log food manually.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {nutritionData.foodLog.map((item, index) => (
                                    <FoodLogEntry key={index} item={item} />
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* RIGHT: WATER TRACKER */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Droplet size={24} className="text-blue-600" />
                            </div>
                            <h2 className="font-bold text-xl text-slate-800">Water Tracker</h2>
                        </div>
                        
                        {/* Water Glasses Row */}
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-4 mb-8">
                            {[...Array(MAX_WATER_CUPS)].map((_, index) => (
                                <WaterGlass
                                    key={index}
                                    isFilled={index < waterCupsFilled}
                                    onClick={() => handleWaterGlassClick(index)}
                                />
                            ))}
                        </div>

                        {/* Progress Label */}
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-blue-600">Progress</span>
                            <span className="text-sm text-slate-400 font-medium">
                                {nutritionData.currentWaterMl} / {nutritionData.dailyWaterGoalMl} ml
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-4 bg-slate-100 rounded-full mb-10 overflow-hidden">
                            <div
                                className="h-4 bg-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ width: `${calculatePercentage(nutritionData.currentWaterMl, nutritionData.dailyWaterGoalMl)}%` }}
                            ></div>
                        </div>

                        {/* Quick Log Buttons */}
                        <div className="grid grid-cols-3 gap-4">
                            {[250, 500, 750].map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => updateWaterIntake(amount, nutritionData.currentWaterMl + amount)} 
                                    className="py-3 text-sm font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    +{amount}ml
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------------
// CHILD COMPONENTS
// ----------------------------------------------------------------------------------

const NutritionStatCard = ({ label, unit, max, current, icon: Icon, color, barColor }) => {
    const percentage = calculatePercentage(current, max);
    const displayCurrent = label === 'Water' ? current.toFixed(1) : Math.round(current);
    const displayMax = label === 'Water' ? max.toFixed(1) : Math.round(max);

    return (
        <div className={`rounded-2xl p-6 shadow-sm border border-slate-100 bg-white`}>
            <div className="flex justify-between items-center mb-4">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={20} />
                </div>
                <span className="font-bold text-slate-400 text-sm">
                    {percentage}%
                </span>
            </div>
            
            <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mb-4">
                {displayCurrent} <span className="text-sm font-medium text-slate-400">/ {displayMax} {unit}</span>
            </p>

            <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${barColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const WaterGlass = ({ isFilled, onClick }) => {
    return (
        <div 
            className="aspect-3/4 border-2 border-blue-200 rounded-b-xl relative cursor-pointer transition-all duration-300 hover:scale-110 overflow-hidden bg-slate-50" 
            onClick={onClick}
        >
            <div 
                className={`absolute bottom-0 w-full bg-blue-400 transition-all duration-700 ease-in-out`} 
                style={{ height: isFilled ? '100%' : '0%' }}
            ></div>
            
            {isFilled && (
                <CheckCircle 
                    size={16} 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-in fade-in zoom-in duration-300" 
                />
            )}
        </div>
    );
};

const FoodLogEntry = ({ item }) => {
    const typeColor = item.isPlanned ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100";
    
    return (
        <div className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
            <div className="flex-1">
                <p className={`font-bold ${item.isPlanned ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {item.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.time || "No Time"}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${typeColor}`}>
                        {item.isPlanned ? item.type : 'Manual'}
                    </span>
                </div>
                <div className="flex text-xs font-medium text-slate-500 gap-4 mt-2">
                    <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {item.calories} <span className="text-[10px] text-slate-300 uppercase">kcal</span></span>
                    <span className="flex items-center gap-1"><Users size={12} className="text-blue-400" /> {item.protein}g <span className="text-[10px] text-slate-300 uppercase">Pro</span></span>
                    <span className="flex items-center gap-1"><Bolt size={12} className="text-green-400" /> {item.carbs}g <span className="text-[10px] text-slate-300 uppercase">Carb</span></span>
                </div>
            </div>
        </div>
    );
};