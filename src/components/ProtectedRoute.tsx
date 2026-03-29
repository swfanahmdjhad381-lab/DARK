import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'moderator' | 'student';
  requireSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  requireSubscription = false 
}) => {
  const { user, profile, loading, isAdmin, isModerator, isSubscribed } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'moderator' && !isModerator) {
    return <Navigate to="/" replace />;
  }

  if (requireSubscription && !isSubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6 text-center" dir="rtl">
        <div className="max-w-md bg-white p-10 rounded-3xl shadow-xl border border-neutral-100">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">اشتراكك غير مفعل</h2>
          <p className="text-neutral-500 mb-8">يرجى التواصل مع المالك لتفعيل اشتراكك والوصول إلى محتوى الكورس.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-neutral-900 text-white font-bold py-4 rounded-2xl hover:bg-neutral-800 transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

import { Shield } from 'lucide-react';
