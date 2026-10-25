import axios from 'axios';
import { Movie, Booking, Review, AdminDashboardData, User } from '../types/index.js';

// Determine API base URL from environment variable (VITE_API_URL / VITE_BACKEND_URL) or fallback to '/api'
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinepass_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  registerInitiate: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    adminSecretKey?: string;
  }) => {
    const res = await api.post('/auth/register-initiate', data);
    return res.data;
  },

  registerVerify: async (email: string, otp: string) => {
    const res = await api.post('/auth/register-verify', { email, otp });
    return res.data;
  },

  loginInitiate: async (email: string, password: string, adminSecretKey?: string) => {
    const res = await api.post('/auth/login-initiate', { email, password, adminSecretKey });
    return res.data;
  },

  loginVerify: async (email: string, otp: string) => {
    const res = await api.post('/auth/login-verify', { email, otp });
    return res.data;
  },

  resendOtp: async (email: string, type: 'signup' | 'login' | 'forgot_password') => {
    const res = await api.post('/auth/resend-otp', { email, type });
    return res.data;
  },

  forgotPasswordInitiate: async (email: string) => {
    const res = await api.post('/auth/forgot-password-initiate', { email });
    return res.data;
  },

  resetPasswordVerify: async (email: string, otp: string, newPassword: string) => {
    const res = await api.post('/auth/reset-password-verify', { email, otp, newPassword });
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const moviesApi = {
  getAll: async (params?: { search?: string; genre?: string; language?: string }): Promise<{ movies: Movie[] }> => {
    const res = await api.get('/movies', { params });
    return res.data;
  },

  getById: async (id: string): Promise<{ movie: Movie }> => {
    const res = await api.get(`/movies/${id}`);
    return res.data;
  },

  getSeats: async (
    id: string,
    showtimeId: string,
    showDate: string
  ): Promise<{
    bookedSeats: string[];
    totalSeats: number;
    showtime: any;
  }> => {
    const res = await api.get(`/movies/${id}/seats`, {
      params: { showtimeId, showDate },
    });
    return res.data;
  },

  create: async (data: Partial<Movie>) => {
    const res = await api.post('/movies', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Movie>) => {
    const res = await api.put(`/movies/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/movies/${id}`);
    return res.data;
  },

  toggleStatus: async (id: string) => {
    const res = await api.patch(`/movies/${id}/toggle-status`);
    return res.data;
  },
};

export const bookingsApi = {
  create: async (data: {
    movieId: string;
    showtimeId: string;
    showDate: string;
    seats: string[];
    paymentMethod?: string;
  }): Promise<{ booking: Booking; message: string }> => {
    const res = await api.post('/bookings', data);
    return res.data;
  },

  createRazorpayOrder: async (data: {
    movieId: string;
    showtimeId: string;
    showDate: string;
    seats: string[];
  }): Promise<{
    success: boolean;
    order: {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
      status: string;
      isSimulated?: boolean;
    };
    keyId: string;
    amount: number;
    currency: string;
    isSimulated?: boolean;
  }> => {
    const res = await api.post('/bookings/razorpay/create-order', data);
    return res.data;
  },

  verifyRazorpayPayment: async (data: {
    movieId: string;
    showtimeId: string;
    showDate: string;
    seats: string[];
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; booking: Booking; message: string }> => {
    const res = await api.post('/bookings/razorpay/verify-payment', data);
    return res.data;
  },

  getMyBookings: async (): Promise<{ bookings: Booking[] }> => {
    const res = await api.get('/bookings/my-bookings');
    return res.data;
  },

  getById: async (id: string): Promise<{ booking: Booking }> => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },
};

export const reviewsApi = {
  getByMovie: async (
    movieId: string
  ): Promise<{
    reviews: Review[];
    distribution: Record<number, number>;
  }> => {
    const res = await api.get(`/reviews/movie/${movieId}`);
    return res.data;
  },

  submit: async (movieId: string, data: { rating: number; comment: string }) => {
    const res = await api.post(`/reviews/movie/${movieId}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  },
};

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
};

export default api;
