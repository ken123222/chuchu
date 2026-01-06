import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import axios from "../api/axiosConfig"; 
import { Home, User, Dumbbell, Calendar, Bell, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [unread, setUnread] = useState(0);
  const token = localStorage.getItem("token");

  // --- NAVIGATION GUARD LOGIC ---
  // Helper to handle navigation safely during a workout
  const handleProtectedNavigation = (path) => {
    // Check if user is currently in a workout session
    if (location.pathname.startsWith("/workout-session")) {
      const confirmLeave = window.confirm(
        "A workout is currently in progress. Do you want to continue workout or leave? (Click OK to leave and stop progress)"
      );
      if (confirmLeave) {
        navigate(path);
      }
      // if "Cancel", we do nothing and stay on the workout page
    } else {
      navigate(path);
    }
  };

  // Logout Handler with Confirmation
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };
  // ------------------------------

  // Fetch unread notifications for the current user
  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data && typeof res.data.unreadCount !== "undefined") {
        setUnread(res.data.unreadCount);
      } else {
        setUnread(0);
      }
    } catch (err) {
      console.error("Navbar: failed to fetch notifications", err);
      setUnread(0);
    }
  };

  useEffect(() => {
    fetchUnread();
    const handler = () => fetchUnread();
    window.addEventListener("notifications:updated", handler);
    return () => window.removeEventListener("notifications:updated", handler);
  }, [token]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Dumbbell, label: "Workout", path: "/workouts" },
    { icon: Calendar, label: "Meal Planner", path: "/meal-planner" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between w-full fixed top-0 left-0 z-50">
      {/* Brand Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => handleProtectedNavigation("/dashboard")}
      >
        <Home size={24} className="text-green-600" />
        <span className="text-xl font-bold tracking-tight text-slate-900">FitTracker</span>
      </div>

      {/* Date Display */}
      <div className="flex-1 flex justify-center hidden sm:flex">
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200 shadow-sm">
          <Calendar size={18} className="text-green-700" />
          <span className="font-medium text-green-800 text-sm">{today}</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex items-center gap-4 min-w-[260px] justify-end text-gray-600">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path === '/dashboard' && location.pathname === '/');

          return (
            <button
              key={item.label}
              className={`flex flex-col items-center transition-colors duration-200 
                          ${isActive ? 'text-green-600 font-semibold' : 'text-gray-600 hover:text-green-600'}`}
              onClick={() => handleProtectedNavigation(item.path)}
            >
              <item.icon size={18} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Notifications */}
        <button
          className={`relative flex flex-col items-center transition-colors duration-200 
                      ${location.pathname === '/notifications' ? 'text-green-600 font-semibold' : 'text-gray-600 hover:text-green-600'}`}
          onClick={() => handleProtectedNavigation("/notifications")}
        >
          <Bell size={18} />
          <span className="text-[11px] mt-0.5">Notifications</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
              {unread}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          className="flex flex-col items-center text-gray-600 hover:text-red-600 transition-colors duration-200"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span className="text-[11px] mt-0.5">Logout</span>
        </button>
      </nav>
    </header>
  );
}