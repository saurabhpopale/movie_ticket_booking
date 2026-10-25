export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Showtime {
  _id: string;
  date: string;
  time: string;
  screen: string;
  price: number;
  totalSeats: number;
}

export interface Movie {
  _id: string;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  genre: string[];
  language: string;
  duration: number;
  releaseDate: string;
  director: string;
  cast: string[];
  ticketPrice: number;
  rating: number;
  ratingCount: number;
  showtimes: Showtime[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  user: string;
  userEmail: string;
  userName: string;
  movie: Movie | string;
  movieTitle: string;
  moviePoster: string;
  showtimeId: string;
  showDate: string;
  showTime: string;
  screen: string;
  seats: string[];
  totalAmount: number;
  paymentStatus: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  movie: string;
  user: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AdminMovieStat {
  _id: string;
  title: string;
  description?: string;
  posterUrl: string;
  bannerUrl?: string;
  genre: string[];
  language?: string;
  duration?: number;
  releaseDate?: string;
  director?: string;
  cast?: string[];
  ticketPrice: number;
  rating: number;
  ratingCount: number;
  totalBookings: number;
  ticketsSold: number;
  collection: number; // Total collection till now
  last2DaysCollection: number; // Last 2 days collection
  last2DaysTicketsSold: number;
  todayCollection: number;
  yesterdayCollection: number;
  showtimes?: Showtime[];
  showtimesCount: number;
  isActive: boolean;
  createdBy?: string;
  isCreatedByMe?: boolean;
}

export interface AdminDashboardData {
  currentAdmin?: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    // Total collection till now
    totalRevenue: number;
    totalTicketsSold: number;
    totalBookings: number;
    totalMovies: number;
    // Last 2 days collections
    last2DaysRevenue: number;
    last2DaysTicketsSold: number;
    last2DaysBookingsCount: number;
    // Breakdown
    todayRevenue: number;
    todayTicketsSold: number;
    todayBookingsCount: number;
    yesterdayRevenue: number;
    yesterdayTicketsSold: number;
    yesterdayBookingsCount: number;
  };
  dailyBreakdown?: Array<{
    date: string;
    label: string;
    revenue: number;
    ticketsSold: number;
    bookingsCount: number;
  }>;
  movieStats: AdminMovieStat[];
  recentBookings: Array<{
    _id: string;
    bookingId: string;
    userName: string;
    userEmail: string;
    movieId?: string;
    movieTitle: string;
    screen: string;
    showDate: string;
    showTime: string;
    seats: string[];
    totalAmount: number;
    paymentStatus?: string;
    paymentMethod?: string;
    createdAt: string;
    isLast2Days?: boolean;
  }>;
}
