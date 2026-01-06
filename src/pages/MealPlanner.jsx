import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { Calendar, X, RefreshCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

const getInitialActiveTab = () => localStorage.getItem('mealPlannerActiveTab') || "planner";

const getInitialDate = () => {
    const savedDate = localStorage.getItem('mealPlannerDate');
    const today = new Date().toISOString().slice(0, 10);
    return savedDate && savedDate <= today ? savedDate : today;
};

const getInitialTargets = () => {
    const cal = localStorage.getItem('mealPlannerTargetCalories');
    const prot = localStorage.getItem('mealPlannerTargetProtein');
    return {
        calories: cal ? Number(cal) : 2000,
        protein: prot ? Number(prot) : 120,
    };
};

export default function MealPlanner({ onMealPlanCreated }) {
    const navigate = useNavigate();

    const initialTargets = getInitialTargets();
    const [modalOpen, setModalOpen] = useState(false);
    const [planName, setPlanName] = useState("");
    const [userInput, setUserInput] = useState("");
    const [date, setDate] = useState(getInitialDate());
    const [dietaryPreference, setDietaryPreference] = useState("Balanced");
    const [targetCalories, setTargetCalories] = useState(initialTargets.calories);
    const [targetProtein, setTargetProtein] = useState(initialTargets.protein);
    const [mealPlans, setMealPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [recipesLoading, setRecipesLoading] = useState(false);
    const [firebaseMeals, setFirebaseMeals] = useState([]);
    const [activeTab, setActiveTab] = useState(getInitialActiveTab());

    const token = localStorage.getItem("token");

    useEffect(() => { localStorage.setItem('mealPlannerActiveTab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('mealPlannerDate', date); }, [date]);
    useEffect(() => { localStorage.setItem('mealPlannerTargetCalories', targetCalories.toString()); }, [targetCalories]);
    useEffect(() => { localStorage.setItem('mealPlannerTargetProtein', targetProtein.toString()); }, [targetProtein]);

    useEffect(() => { if (!token) navigate("/login"); }, [token, navigate]);

    const fetchNotificationsCount = async () => { /* Add notification logic here if needed */ }; 

    useEffect(() => {
        const fetchMealPlans = async () => {
            if (!token) return;
            try {
                const res = await axios.get("/mealPlans", { headers: { Authorization: `Bearer ${token}` } });
                setMealPlans(res.data);
                fetchNotificationsCount(); 
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch meal plans");
            }
        };
        fetchMealPlans();
        
        window.addEventListener("mealplans:updated", fetchMealPlans);
        return () => {
            window.removeEventListener("mealplans:updated", fetchMealPlans);
        };
    }, [token]);

    useEffect(() => {
        // Fetch recipes from backend (keep for backwards compatibility)
        const fetchRecipes = async () => {
            if (!token) return;
            setRecipesLoading(true);
            try {
                const res = await axios.get("/recipes", { headers: { Authorization: `Bearer ${token}` } });
                setRecipes(res.data?.recipes || []);
            } catch (err) {
                console.error("Failed to fetch recipes:", err);
            } finally {
                setRecipesLoading(false);
            }
        };

        // Fetch meals from Firebase URLs provided by the user
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

        const fetchFirebaseMeals = async () => {
            try {
                const promises = firebaseUrls.map((u) => fetch(u).then(r => r.json()).catch(() => null));
                const results = await Promise.all(promises);
                const normalized = results.filter(Boolean).map((m, idx) => ({
                    id: m?.id || `meal${idx+1}`,
                    name: m?.name || m?.title || `Meal ${idx+1}`,
                    description: m?.description || m?.desc || '',
                    calories: m?.calories || m?.cal || 0,
                    protein: m?.protein || 0,
                    prep_time: m?.prep_time || m?.prepTime || 0,
                    servings: m?.servings || 1,
                    tags: m?.tags || [],
                    raw: m,
                }));
                setFirebaseMeals(normalized);
            } catch (err) {
                console.error('Failed to fetch firebase meals', err);
            }
        };

        fetchRecipes();
        fetchFirebaseMeals();
    }, [token]);

    const generateMealPlan = async () => {
        if (!planName || !userInput) {
            return toast.error("Please fill in the Plan Name and Your Notes/Preferences.");
        }

        const USER_CAL_TARGET = Number(targetCalories);
        const USER_PROT_TARGET = Number(targetProtein);

        if (isNaN(USER_CAL_TARGET) || USER_CAL_TARGET <= 0 || isNaN(USER_PROT_TARGET) || USER_PROT_TARGET <= 0) {
            return toast.error("Target Calories and Target Protein must be valid numbers greater than zero.");
        }
        
        setLoading(true);
        try {
            const recipesRes = await axios.get('/recipes');
            let allRecipes = (recipesRes.data && recipesRes.data.recipes) || [];

            if (allRecipes.length === 0) {
                toast.error("No recipes available to generate a plan.");
                return;
            }

            let filteredRecipes = allRecipes.filter((meal) => {
                const prot = Number(meal.protein) || 0;
                const carb = Number(meal.carbs) || 0;
                const cal = Number(meal.calories) || 0;

                if (dietaryPreference === "High Protein" && prot < 15) return false;
                if (dietaryPreference === "Low Carb" && carb > 30) return false;
                if (dietaryPreference === "Vegetarian" && !meal.tags?.includes("vegetarian")) return false;
                if (dietaryPreference === "Mediterranean" && !meal.tags?.includes("mediterranean")) return false;
                if (dietaryPreference === "Weight Loss" && cal > 500) return false; 

                return true;
            });

            if (filteredRecipes.length === 0) {
                toast.error("No recipes match your dietary preference. Try 'Balanced'.");
                return;
            }

            const normalizedRecipes = filteredRecipes.map(r => ({
                ...r,
                calories: Math.round(Number(r.calories) || 0),
                protein: Math.round(Number(r.protein) || 0),
                density: (Number(r.protein) || 0) / (Number(r.calories) || 1),
                guid: Math.random().toString(36).substring(2, 9) + Date.now(), 
            }));

            let bestPlan = [];
            let bestCalDiff = Infinity;
            let bestProtDiff = Infinity;

            let mealPool = [...normalizedRecipes].sort((a, b) => b.density - a.density);
            
            const NUM_PERMUTATIONS = 10;
            
            for(let perm = 0; perm < NUM_PERMUTATIONS; perm++) {
                let currentPlan = [];
                let currentCal = 0;
                let currentProt = 0;
                
                const startItemIndex = perm % mealPool.length;
                if (mealPool[startItemIndex]) {
                    currentPlan.push(mealPool[startItemIndex]);
                    currentCal += mealPool[startItemIndex].calories;
                    currentProt += mealPool[startItemIndex].protein;
                }

                let availablePool = [...mealPool].filter(r => r !== mealPool[startItemIndex]);

                for (let i = 0; i < 9; i++) {
                    if (availablePool.length === 0) break;

                    let bestFit = null;
                    let minScore = Infinity;
                    
                    for (const recipe of availablePool) {
                        const potentialCal = currentCal + recipe.calories;
                        const potentialProt = currentProt + recipe.protein;

                        const calDiff = Math.abs(potentialCal - USER_CAL_TARGET);
                        const protDiff = Math.abs(potentialProt - USER_PROT_TARGET);
                        const score = calDiff + protDiff * 5; 

                        if (potentialCal > USER_CAL_TARGET * 1.15) continue; 

                        if (score < minScore) {
                            minScore = score;
                            bestFit = recipe;
                        }
                    }

                    if (bestFit) {
                        currentCal += bestFit.calories;
                        currentProt += bestFit.protein;
                        currentPlan.push(bestFit);
                        availablePool = availablePool.filter(r => r !== bestFit);
                    } else {
                        break;
                    }
                }
                
                const finalCalDiff = Math.abs(currentCal - USER_CAL_TARGET);
                const finalProtDiff = Math.abs(currentProt - USER_PROT_TARGET);
                
                if ((finalCalDiff + finalProtDiff * 5) < (bestCalDiff + bestProtDiff * 5)) {
                    bestCalDiff = finalCalDiff;
                    bestProtDiff = finalProtDiff;
                    bestPlan = currentPlan;
                }
            }

            const generatedMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
            let mealsToDistribute = [...bestPlan].sort((a, b) => b.calories - a.calories); 

            const mealKeys = ["dinner", "lunch", "breakfast", "snacks"];
            const mealCalPercentages = { dinner: 0.35, lunch: 0.35, breakfast: 0.20, snacks: 0.10 }; 

            const totalPlanCal = bestPlan.reduce((sum, item) => sum + item.calories, 0);

            for (const mealType of mealKeys) {
                let currentCal = 0;
                const targetCalForMeal = totalPlanCal * mealCalPercentages[mealType];
                
                for (let i = mealsToDistribute.length - 1; i >= 0; i--) {
                    const recipe = mealsToDistribute[i];
                    
                    if ((currentCal + recipe.calories) <= targetCalForMeal * 1.2 || currentCal === 0) {
                        generatedMeals[mealType].push(recipe);
                        currentCal += recipe.calories;
                        mealsToDistribute.splice(i, 1);
                    }
                }
            }
            
            generatedMeals.dinner.push(...mealsToDistribute);

            const newPlan = {
                name: planName,
                userInput,
                date,
                targetCalories: USER_CAL_TARGET,
                targetProtein: USER_PROT_TARGET,
                dietaryPreference,
                meals: Object.fromEntries(Object.entries(generatedMeals).map(([type, items]) => [
                    type,
                    items.map(r => ({
                        name: r.name, description: r.description || '', calories: r.calories,
                        protein: r.protein, carbs: r.carbs, fat: r.fat, prep_time: r.prep_time,
                        servings: r.servings, category_id: r.category_id, tags: r.tags,
                    }))
                ])),
            };

            const res = await axios.post("/mealPlans", newPlan, { headers: { Authorization: `Bearer ${token}` } });

            const createdPlan = res.data.mealPlan;
            setMealPlans((prev) => [createdPlan, ...prev.filter(p => new Date(p.date).toISOString().slice(0, 10) !== date)]);
            setModalOpen(false);
            setPlanName("");
            setUserInput("");
            setDate(new Date(createdPlan.date).toISOString().slice(0, 10));
            setActiveTab("planner");

            fetchNotificationsCount();
            window.dispatchEvent(new Event("notifications:updated"));
            window.dispatchEvent(new Event("mealplans:updated"));
            
            toast.success("Meal Plan Created! Viewing the new plan. (Targeted Cal/Prot closely)");
            
            if (onMealPlanCreated) onMealPlanCreated(createdPlan);

        } catch (err) {
            console.error("Error generating meal plan:", err.response?.data || err);
            toast.error("Error generating meal plan. See console for details.");
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (iso) => {
        try {
            return new Date(iso).toLocaleDateString("en-GB", {day: 'numeric', month: 'numeric', year: 'numeric'});
        } catch (e) { return iso; }
    };

    const activePlan = mealPlans.find((p) => new Date(p.date).toISOString().slice(0, 10) === date);

    const viewPlan = (plan) => {
        setDate(new Date(plan.date).toISOString().slice(0, 10));
        setActiveTab("planner");
        toast.success(`Viewing plan details for ${plan.name} in Meal Planner tab.`);
    };

    const deletePlan = async (id) => {
        if (!confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) return;
        try {
            await axios.delete(`/mealPlans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setMealPlans(mealPlans.filter((m) => m._id !== id));
            if (activePlan?._id === id) setDate(new Date().toISOString().slice(0, 10));
            window.dispatchEvent(new Event("mealplans:updated"));
            toast.success("Meal plan deleted successfully.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete meal plan.");
        }
    };

    const handleAddToPlan = async (recipe) => {
        if (!token) { navigate("/login"); return; }
        try {
            let plan = activePlan;
            
            if (!plan) {
                try {
                    const createRes = await axios.post("/mealPlans", {
                        name: `Manual Plan for ${formatDate(date)}`, date,
                        targetCalories: targetCalories, targetProtein: targetProtein, 
                        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    plan = createRes.data.mealPlan;
                    setMealPlans((prev) => [plan, ...prev]);
                    toast.success(`No plan found for ${formatDate(date)}. A new plan was created.`);
                } catch (err) {
                    console.error("Failed to create blank plan:", err);
                    return toast.error("Could not create a plan for the selected date.");
                }
            }
            
            const mealType = (window.prompt(`Add ${recipe.name} to which meal? (breakfast, lunch, dinner, snacks)`, "lunch") || "").toLowerCase();
            if (!["breakfast", "lunch", "dinner", "snacks"].includes(mealType)) {
                return toast.error("Invalid meal type selected. Please try again.");
            }

            const mealObj = {
                name: recipe.name || "Meal", description: recipe.description || recipe.desc || "",
                calories: Math.round(Number(recipe.calories) || 0), protein: Math.round(Number(recipe.protein) || 0),
                carbs: Number(recipe.carbs) || 0, fat: Number(recipe.fat) || 0,
                prep_time: Number(recipe.prep_time) || 0, servings: Number(recipe.servings) || 1,
                category_id: Number(recipe.category_id) || 0, tags: recipe.tags || [],
            };

            const res = await axios.patch(`/mealPlans/${plan._id}/meals`, { mealType, meal: mealObj }, { headers: { Authorization: `Bearer ${token}` } });
            const updated = res.data;

            setMealPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
            setDate(new Date(updated.date).toISOString().slice(0, 10)); 
            setActiveTab("planner");

            fetchNotificationsCount();
            window.dispatchEvent(new Event("notifications:updated"));
            window.dispatchEvent(new Event("mealplans:updated"));
            toast.success(`Successfully added ${recipe.name} to ${mealType}. Viewing the updated plan.`);

        } catch (err) {
            console.error("Failed to add recipe to plan:", err.response?.data || err);
            toast.error("Failed to add recipe to plan.");
        }
    };

    const calculateStats = (plan) => {
        if (!plan || !plan.meals) return { calories: 0, protein: 0, meals: 0, prepTime: 0 };
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalMeals = 0;
        let totalPrepTime = 0;

        Object.values(plan.meals).forEach((mealArray) => {
            if (Array.isArray(mealArray)) {
                totalMeals += mealArray.length;
                mealArray.forEach((meal) => {
                    totalCalories += Math.round(Number(meal.calories) || 0);
                    totalProtein += Math.round(Number(meal.protein) || 0);
                    totalPrepTime += Math.round(Number(meal.prep_time) || 0);
                });
            }
        });

        const avgPrepTime = totalMeals > 0 ? Math.round(totalPrepTime / totalMeals) : 0;
        return { calories: totalCalories, protein: totalProtein, meals: totalMeals, prepTime: avgPrepTime };
    };


    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster />

            <div className="pt-28 max-w-7xl mx-auto px-8 pb-16">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
                        <p className="text-gray-500 text-sm">Plan your meals for optimal nutrition and convenience</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setModalOpen(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-medium"
                        >
                            + New Plan
                        </button>
                        {/* New Food Log removed from header per request */}
                    </div>
                </div>

                <div className="bg-gray-100 rounded-full p-1 flex mb-10">
                    {["planner", "saved", "recipes"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-full text-sm font-medium ${
                                activeTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500"
                            }`}
                        >
                            {tab === "planner" && "Meal Planner"}
                            {tab === "saved" && "Saved Plans"}
                            {tab === "recipes" && "Recipe Database"}
                        </button>
                    ))}
                </div>

                {activeTab === "planner" && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-8">
                        <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <label htmlFor="plan-date-picker" className="text-gray-700 font-medium text-lg">
                                    Viewing Plan For:
                                </label>
                                <input
                                    id="plan-date-picker"
                                    type="date"
                                    className="rounded-lg p-2.5 bg-gray-50"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            {activePlan && (
                                <p className="text-sm text-gray-500 italic hidden sm:block">
                                    Plan Status: **Active** for {activePlan.dietaryPreference}
                                </p>
                            )}
                        </div>
                        
                        {activePlan ? (
                            <div className="p-0">
                                <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900">{activePlan.name}</h2>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => deletePlan(activePlan._id)}
                                            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium text-sm transition"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Hydration removed from Meal Planner per request */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                                    {(() => {
                                        const stats = calculateStats(activePlan);
                                        
                                        const statsData = [
                                            { label: 'Calorie Summary', value: stats.calories, target: activePlan.targetCalories, unit: 'cal', color: 'text-orange-600', bg: 'bg-orange-50', icon: '🔥'},
                                            { label: 'Protein Summary', value: stats.protein, target: activePlan.targetProtein, unit: 'g', color: 'text-blue-600', bg: 'bg-blue-50', icon: '💪'},
                                            { label: 'Total Meals', value: stats.meals, unit: '', color: 'text-green-600', bg: 'bg-green-50', icon: '🍽️'},
                                            { label: 'Avg Prep Time', value: stats.prepTime, unit: 'min', color: 'text-purple-600', bg: 'bg-purple-50', icon: '⏱️'},
                                        ];

                                        return statsData.map((s) => (
                                            <div key={s.label} className={`${s.bg} p-5 rounded-xl shadow-md col-span-2 md:col-span-1`}>
                                                <p className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                                                    {s.icon} {s.label}
                                                </p>
                                                
                                                {s.target !== undefined ? (
                                                    <div className="mt-2">
                                                        <p className={`text-3xl font-bold ${s.color}`}>
                                                            {s.value} <span className="text-xl font-normal">{s.unit}</span>
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Target: <span className="font-bold">{s.target} {s.unit}</span>
                                                        </p>
                                                        {s.value > s.target * 1.05 && (
                                                            <p className="text-xs text-red-500 font-medium mt-1">
                                                                Overshot by {s.value - s.target} {s.unit}!
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2">
                                                        <p className={`text-3xl font-bold ${s.color}`}>
                                                            {s.value} <span className="text-xl font-normal">{s.unit}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Object.entries(activePlan.meals || {}).map(([mealName, items]) => (
                                        <div key={mealName} className="rounded-xl p-4 bg-gray-50 shadow-inner">
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                                                <h4 className="font-bold text-lg capitalize text-gray-800">{mealName}</h4>
                                                <span className="text-sm text-gray-500">{items ? items.length : 0} items</span>
                                            </div>

                                            <div className="space-y-3">
                                                {items && items.length > 0 ? (
                                                    items.map((item, index) => (
                                                        <div key={index} className="flex items-start gap-3 p-2 bg-white rounded-lg hover:shadow-sm transition">
                                                            <span className="text-indigo-500 mt-1">🍴</span>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    <span className="text-orange-500 font-semibold">{Math.round(item.calories)} cal</span> | {Math.round(item.protein)}g protein
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 italic text-sm py-4 text-center">No meals added.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        ) : (
                            <div className="px-8 py-20 text-center bg-gray-50 rounded-2xl mt-4 shadow-inner">
                                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-800">No Meal Plan Selected for {formatDate(date)}</h2>
                                <p className="text-gray-500 mb-8 mt-2 max-w-md mx-auto">
                                    There are no saved plans for the selected date. Choose an action below to get started.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-medium shadow-md"
                                    >
                                        + Generate New Plan
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("saved")}
                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-8 py-3 rounded-full font-medium"
                                    >
                                        View Saved Plans
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "recipes" && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                        <h3 className="text-2xl font-bold mb-6">Recipe Database</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Select a recipe and click "Add to Plan" to incorporate it into a meal plan for today's selected date (currently set to **{formatDate(date)}**).
                        </p>
                        {recipesLoading ? (
                            <div className="text-center py-12">Loading recipes...</div>
                        ) : recipes.length === 0 ? (
                            <div className="text-center py-12">No recipes available.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {recipes.map((r, idx) => (
                                    <div key={r.id || r.name + idx} className="rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition">
                                        <div className="font-semibold text-gray-900 line-clamp-1">{r.name}</div>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-3">{r.description || r.desc || "No description provided."}</p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                                            <span>{Math.round(r.calories) || 'N/A'} cal</span>
                                            <span>{Math.round(r.protein) || 'N/A'}g protein</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button onClick={() => handleAddToPlan(r)} className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600">Add to Plan</button>
                                            <button 
                                                onClick={() => { navigator.clipboard?.writeText(JSON.stringify(r)); toast.success("Copied!"); }} 
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "saved" && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                        <h3 className="text-2xl font-bold mb-6">Saved Plans</h3>
                        
                        <div className="mb-6 flex items-center gap-4">
                            <label htmlFor="plan-date-filter" className="text-gray-700 font-medium">Set Active Date:</label>
                            <input
                                id="plan-date-filter"
                                type="date"
                                className="rounded-lg p-2.5"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                             <p className="text-sm text-gray-500 italic">
                                {activePlan ? `The plan for this date is currently active in the Meal Planner tab.` : "No plan found for this date. Click 'View Plan' to change the active date."}
                            </p>
                        </div>

                        {mealPlans.length === 0 ? (
                            <div className="text-center py-12">No saved meal plans yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mealPlans.sort((a, b) => new Date(b.date) - new Date(a.date)).map((plan) => {
                                    const mealStats = calculateStats(plan);
                                    const isSelected = new Date(plan.date).toISOString().slice(0, 10) === date;

                                    return (
                                        <div
                                            key={plan._id}
                                            className={`rounded-lg p-6 bg-gray-50 shadow-md transition ${
                                                isSelected ? "ring-2 ring-indigo-400" : "hover:shadow-lg"
                                            }`}
                                        >
                                            <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                                            <p className="text-sm text-gray-500 mb-4">{formatDate(plan.date)}</p>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Target Calories:</span>
                                                    <span className="font-semibold text-gray-900">{plan.targetCalories || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Actual Calories:</span>
                                                    <span className="font-semibold text-orange-600">{mealStats.calories}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Target Protein:</span>
                                                    <span className="font-semibold text-gray-900">{plan.targetProtein || 'N/A'}g</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Actual Protein:</span>
                                                    <span className="font-semibold text-blue-600">{mealStats.protein}g</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => viewPlan(plan)}
                                                    className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium text-sm"
                                                >
                                                    View Plan
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(plan._id)}
                                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm"
                                                >
                                                    ✕ Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {modalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl w-[440px] shadow-xl p-6 relative">
                            <form onSubmit={(e) => { e.preventDefault(); generateMealPlan(); }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Create New Meal Plan</h3>
                                    <p className="text-sm text-gray-500">Generate a personalized meal plan</p>
                                </div>
                                <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400">Close</button>
                            </div>

                            {[
                                { label: "Plan Name", placeholder: "e.g., Weekly Meal Plan", value: planName, setter: setPlanName },
                                { label: "Your Notes / Preferences", placeholder: "e.g., No peanuts, prefer chicken", value: userInput, setter: setUserInput }
                            ].map((f) => (
                                <div key={f.label} className="mb-4"> 
                                    <label className="text-sm font-medium">{f.label}</label>
                                    <input
                                        required
                                        className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder={f.placeholder}
                                        value={f.value}
                                        onChange={(e) => f.setter(e.target.value)}
                                    />
                                </div>
                            ))}

                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Target Calories (cal)</label>
                                    <input
                                        type="number"
                                        min="1000"
                                        step="100"
                                        required
                                        className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder="2000"
                                        value={targetCalories}
                                        onChange={(e) => setTargetCalories(Number(e.target.value))}
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="text-sm font-medium">Target Protein (g)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        step="10"
                                        required
                                        className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        placeholder="120"
                                        value={targetProtein}
                                        onChange={(e) => setTargetProtein(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="text-sm font-medium">Dietary Preference</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
                                    value={dietaryPreference}
                                    onChange={(e) => setDietaryPreference(e.target.value)}
                                >
                                    <option value="Balanced">Balanced</option>
                                    <option value="High Protein">High Protein</option>
                                    <option value="Low Carb">Low Carb</option>
                                    <option value="Vegetarian">Vegetarian</option>
                                    <option value="Mediterranean">Mediterranean</option>
                                    <option value="Weight Loss">Weight Loss (Low Cal)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center transition disabled:bg-gray-400"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCcw size={16} className="animate-spin mr-2" /> Generating...
                                    </>
                                ) : (
                                    "Generate Plan"
                                )}
                            </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}