import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from '../firebase';
import { LogOut, User, Video, Users, Home, Settings, Shield, Menu, X, ChevronRight, CreditCard, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home, show: true },
    { name: 'الفيديوهات', path: '/videos', icon: Video, show: true },
    { name: 'باقات الاشتراك', path: '/subscriptions', icon: CreditCard, show: true },
    { name: 'الدردشة', path: '/chat', icon: MessageSquare, show: true },
    { name: 'الأعضاء', path: '/admin/users', icon: Users, show: isAdmin },
    { name: 'إدارة الفيديوهات', path: '/admin/videos', icon: Shield, show: isModerator },
    { name: 'الملف الشخصي', path: '/profile', icon: User, show: true },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Video className="w-6 h-6" />
          <span>كورس دارك</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 bg-white border-l border-neutral-200 flex flex-col z-50 transition-all duration-300 md:translate-x-0 md:static md:h-screen md:z-10",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn("p-6 border-b border-neutral-100 hidden md:flex items-center justify-between", isSidebarCollapsed && "justify-center")}>
          {!isSidebarCollapsed && (
            <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <Video className="w-8 h-8" />
              <span>كورس دارك</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-6 border-b border-neutral-100 md:hidden flex items-center justify-between">
          <span className="font-bold text-lg">القائمة</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter(item => item.show).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                location.pathname === item.path 
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-sm" 
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
                isSidebarCollapsed && "justify-center px-0"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === item.path && "scale-110")} />
              {!isSidebarCollapsed && <span>{item.name}</span>}
              {isSidebarCollapsed && (
                <div className="absolute right-full mr-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          {user && (
            <div className={cn("flex items-center gap-3 px-4 py-3 mb-4", isSidebarCollapsed && "justify-center px-0")}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.username?.charAt(0)
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile?.displayName || profile?.username}</p>
                  <p className="text-xs text-neutral-400 truncate">{profile?.role === 'admin' ? 'المالك' : profile?.role === 'moderator' ? 'مشرف' : 'مشترك'}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group relative",
              isSidebarCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {!isSidebarCollapsed && <span>تسجيل الخروج</span>}
            {isSidebarCollapsed && (
              <div className="absolute right-full mr-2 px-2 py-1 bg-red-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                تسجيل الخروج
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-10 h-full overflow-y-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
