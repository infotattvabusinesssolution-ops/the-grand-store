import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  Gavel, 
  Calendar, 
  Gift, 
  Info, 
  ExternalLink,
  X
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell({ className = "", isVendor = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=25');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently catch in polling
      console.warn("Could not fetch notifications", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 35000); // 35s polling
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read", err);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    setIsOpen(false);

    // If this is an auction victory notification, route to the specific lot with celebration experience
    if (
      notification.type === 'auction' &&
      (notification.title?.includes('Won') || notification.message?.toLowerCase().includes('won'))
    ) {
      const lotId = notification.metadata?.lotId || notification.link?.split('/').pop();
      if (lotId) {
        navigate(`/auction/${lotId}?celebrate=true`);
        return;
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'maintenance_fee':
        return <CreditCard size={15} className="text-[#e1bd70]" />;
      case 'order':
        return <ShoppingBag size={15} className="text-emerald-400" />;
      case 'delivery':
        return <Truck size={15} className="text-sky-400" />;
      case 'auction':
        return <Gavel size={15} className="text-amber-400" />;
      case 'event':
        return <Calendar size={15} className="text-rose-400" />;
      case 'birthday':
        return <Gift size={15} className="text-pink-400" />;
      default:
        return <Info size={15} className="text-gold-gradient" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative p-2.5 rounded-full text-white/80 hover:text-[#e1bd70] hover:bg-white/[0.04] transition-all focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-black bg-[#c9a35b] rounded-full shadow-[0_0_10px_rgba(201,163,91,0.6)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[85vh] bg-[#0c0c0d] border border-[#c9a35b]/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-[999999] overflow-hidden flex flex-col font-sans backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <span className="text-white font-serif text-base tracking-wide font-medium">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#c9a35b]/20 text-[#e1bd70] border border-[#c9a35b]/40">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] uppercase tracking-wider text-[#e1bd70] hover:text-white flex items-center gap-1 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px] divide-y divide-white/[0.04]">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <Bell size={28} className="mx-auto mb-3 text-white/20" />
                  <p className="text-sm text-white/70 font-medium">No notifications yet</p>
                  <p className="text-xs text-white/40 mt-1">
                    Updates on orders, auctions, and activities will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3.5 group hover:bg-white/[0.03] ${
                      !item.isRead ? 'bg-gradient-to-r from-[#c9a35b]/[0.08] to-transparent' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] shrink-0 mt-0.5 group-hover:border-[#c9a35b]/40 transition-colors">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`text-xs truncate ${!item.isRead ? 'text-white font-semibold' : 'text-white/80 font-normal'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-white/40 whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      {item.link && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-[#e1bd70] group-hover:underline">
                          <span>View details</span>
                          <ExternalLink size={10} />
                        </div>
                      )}
                    </div>

                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#c9a35b] shrink-0 mt-2 shadow-[0_0_6px_rgba(201,163,91,0.8)]" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/[0.06] bg-black/40 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (isVendor) {
                      navigate('/vendor/dashboard');
                    } else {
                      navigate('/customer/profile');
                    }
                  }}
                  className="text-xs text-[#e1bd70] hover:text-white uppercase tracking-widest font-semibold transition-colors"
                >
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
