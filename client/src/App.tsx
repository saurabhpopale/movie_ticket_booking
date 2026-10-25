import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { DevOtpBanner } from './components/DevOtpBanner.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

import { Home } from './pages/Home.js';
import { Movies } from './pages/Movies.js';
import { MovieDetails } from './pages/MovieDetails.js';
import { BookSeats } from './pages/BookSeats.js';
import { MyBookings } from './pages/MyBookings.js';
import { Login } from './pages/Login.js';
import { Signup } from './pages/Signup.js';
import { ForgotPassword } from './pages/ForgotPassword.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { PostMovie } from './pages/admin/PostMovie.js';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fd] text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/movies/:id/book" element={<BookSeats />} />

          {/* User Protected Routes */}
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute forbidAdmin={true}>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/post-movie"
            element={
              <ProtectedRoute requireAdmin={true}>
                <PostMovie />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/movies/new"
            element={
              <ProtectedRoute requireAdmin={true}>
                <PostMovie />
              </ProtectedRoute>
            }
          />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <DevOtpBanner />
    </div>
  );
};
