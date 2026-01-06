import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard"; // Corrected casing: "dashboard" -> "Dashboard"
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Workouts from "./pages/Workouts";
import Notifications from "./pages/Notifications";
import WorkoutCategory from "./pages/WorkoutCategory";
import Register from "./pages/Register";  
import MealPlanner from "./pages/MealPlanner"; 
import PrivateRoute from "./components/PrivateRoute"; 
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutComplete from "./pages/WorkoutComplete";
// Diet page removed - nutrition moved into Dashboard

// ⬅️ ADDED NEW IMPORTS FOR PASSWORD RESET
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        {/* Root route - redirect to login */}
        <Route path="/" element={<Login />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* ⬅️ ADDED NEW PUBLIC ROUTES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Private Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        {/* Diet route removed - moved water tracker into Dashboard */}

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/workouts"
          element={
            <PrivateRoute>
              <Workouts />
            </PrivateRoute>
          }
        />
        <Route
          path="/meal-planner"
          element={
            <PrivateRoute>
              <MealPlanner />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/workout/category/:category"
          element={
            <PrivateRoute>
              <WorkoutCategory />
            </PrivateRoute>
          }
        />
        <Route
          path="/workout-session/:id"
          element={
            <PrivateRoute>
              <WorkoutSession />
            </PrivateRoute>
          }
        />
        <Route
          path="/workout-complete"
          element={
            <PrivateRoute>
              <WorkoutComplete />
            </PrivateRoute>
          }
        />

        {/* Redirect unknown routes to login or dashboard */}
        <Route
          path="*"
          element={
            localStorage.getItem("token") ? <Dashboard /> : <Login />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;