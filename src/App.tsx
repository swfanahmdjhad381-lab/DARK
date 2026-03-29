import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Videos } from './pages/Videos';
import { VideoPlayer } from './pages/VideoPlayer';
import { AdminUsers } from './pages/AdminUsers';
import { AdminVideos } from './pages/AdminVideos';
import { Profile } from './pages/Profile';
import { SubscriptionPlans } from './pages/SubscriptionPlans';
import { Chat } from './pages/Chat';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout><Home /></Layout>} path="/" />
            <Route element={<Layout><Videos /></Layout>} path="/videos" />
            <Route element={<Layout><VideoPlayer /></Layout>} path="/videos/:id" />
            <Route element={<Layout><Profile /></Layout>} path="/profile" />
            <Route element={<Layout><SubscriptionPlans /></Layout>} path="/subscriptions" />
            <Route element={<Layout><Chat /></Layout>} path="/chat" />
            
            {/* Admin Only */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route element={<Layout><AdminUsers /></Layout>} path="/admin/users" />
            </Route>

            {/* Moderator/Admin */}
            <Route element={<ProtectedRoute requiredRole="moderator" />}>
              <Route element={<Layout><AdminVideos /></Layout>} path="/admin/videos" />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
