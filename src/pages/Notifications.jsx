import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { Bell, Droplet, Dumbbell as DB, Award, Apple, AlertTriangle } from "lucide-react";

export default function Notifications() {
  const [data, setData] = useState({
    unreadCount: 0,
    urgentCount: 0,
    categories: { water: 0, workout: 0, nutrition: 0, achievement: 0 },
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const categoryIcons = {
    water: <Droplet className="text-blue-600" />,
    workout: <DB className="text-red-600" />,
    nutrition: <Apple className="text-green-600" />,
    achievement: <Award className="text-yellow-500" />,
  };

  const priorityColor = {
    high: "text-red-600",
    medium: "text-orange-500",
    low: "text-gray-500",
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) setData(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(
        "/notifications/mark-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await axios.put(`/notifications/mark/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: prev.unreadCount - 1 >= 0 ? prev.unreadCount - 1 : 0,
      }));
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (err) {
      console.error("Failed to mark single notification read:", err);
    }
  };

  // Previously allowed explicit 'Take action' buttons. Per request, action button removed
  // and notifications are marked read on click. If you want navigation based on
  // an action payload, reintroduce a handler here.

  useEffect(() => { 
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:updated', handler);
    return () => window.removeEventListener('notifications:updated', handler);
  }, [token]);

  if (loading) return <div className="p-6">Loading notifications...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-28 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-2">
            <Bell className="text-green-600" /> Notifications
          </h1>
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Mark All Read
          </button>
        </div>

        {/* Summary Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-5 py-3 flex justify-between items-center hover:bg-gray-200 transition">
            <span>Unread</span>
            <span className="font-bold">{data.unreadCount}</span>
          </div>
          <div className="flex-1 bg-red-100 text-red-600 rounded-lg px-5 py-3 flex justify-between items-center hover:bg-red-200 transition">
            <span>Urgent</span>
            <span className="font-bold">{data.urgentCount}</span>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(data.categories).map(([cat, count]) => (
            <div key={cat} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition">
              {categoryIcons[cat]}
              <div>
                <p className="capitalize text-gray-600">{cat}</p>
                <h2 className="text-xl font-bold">{count}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-4">
          {data.notifications.length === 0 ? (
            <p className="text-gray-500 text-center">No notifications available</p>
          ) : (
            data.notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markSingleRead(n.id); }}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {categoryIcons[n.category]}
                      <div>
                        <h3 className="font-semibold text-lg">{n.title}</h3>
                        <p className={`text-sm ${priorityColor[n.priority]}`}>
                          {n.priority.toUpperCase()} PRIORITY
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.read ? (
                        <button onClick={(e) => { e.stopPropagation(); markSingleRead(n.id); }} className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md">Mark read</button>
                      ) : (
                        <span className="text-xs text-slate-400">Read</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-sm">{n.time}</p>
                    <div className="flex items-center gap-2">
                      {n.link && (
                        <a onClick={(e) => e.stopPropagation()} href={n.link} className="text-indigo-600 text-sm">More</a>
                      )}
                      <span className="text-xs text-slate-400">{n.category}</span>
                    </div>
                  </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
