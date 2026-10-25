import { Router, Response } from 'express';
import { Movie } from '../models/Movie.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { protect, adminOnly, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET Admin Dashboard Analytics & Collections
router.get('/dashboard', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    const bookings = await Booking.find({ paymentStatus: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
    const reviews = await Review.find();

    const now = new Date();
    // Start of today: 00:00:00
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Start of yesterday: 00:00:00
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    // 48 hours ago
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    // Threshold for last 2 days: earlier of yesterday midnight or 48 hours ago
    const twoDaysThreshold = new Date(Math.min(startOfYesterday.getTime(), fortyEightHoursAgo.getTime()));

    const isLast2DaysBooking = (createdAt: Date) => {
      const bTime = new Date(createdAt).getTime();
      return bTime >= twoDaysThreshold.getTime();
    };

    const isTodayBooking = (createdAt: Date) => {
      const bTime = new Date(createdAt).getTime();
      return bTime >= startOfToday.getTime();
    };

    const isYesterdayBooking = (createdAt: Date) => {
      const bTime = new Date(createdAt).getTime();
      return bTime >= startOfYesterday.getTime() && bTime < startOfToday.getTime();
    };

    // Overall stats - Total till now and Last 2 days
    let totalRevenue = 0; // Total collection till now
    let totalTicketsSold = 0;
    let last2DaysRevenue = 0; // Last 2 days collection
    let last2DaysTicketsSold = 0;
    let last2DaysBookingsCount = 0;

    let todayRevenue = 0;
    let todayTicketsSold = 0;
    let todayBookingsCount = 0;

    let yesterdayRevenue = 0;
    let yesterdayTicketsSold = 0;
    let yesterdayBookingsCount = 0;

    bookings.forEach((b) => {
      const amount = b.totalAmount || 0;
      const seatsCount = b.seats ? b.seats.length : 0;
      const bDate = b.createdAt || new Date();

      // Cumulative Total Till Now
      totalRevenue += amount;
      totalTicketsSold += seatsCount;

      // Last 2 Days
      if (isLast2DaysBooking(bDate)) {
        last2DaysRevenue += amount;
        last2DaysTicketsSold += seatsCount;
        last2DaysBookingsCount += 1;
      }

      // Today
      if (isTodayBooking(bDate)) {
        todayRevenue += amount;
        todayTicketsSold += seatsCount;
        todayBookingsCount += 1;
      }

      // Yesterday
      if (isYesterdayBooking(bDate)) {
        yesterdayRevenue += amount;
        yesterdayTicketsSold += seatsCount;
        yesterdayBookingsCount += 1;
      }
    });

    const currentAdminId = req.user?._id?.toString();

    // Map bookings and reviews per movie (Current Movie Records)
    const movieStats = movies.map((movie) => {
      const movieBookings = bookings.filter((b) => b.movie.toString() === movie._id.toString());
      const movieReviews = reviews.filter((r) => r.movie.toString() === movie._id.toString());

      let collection = 0; // Total collection till now
      let ticketsSold = 0;
      let last2DaysCollection = 0; // Last 2 days collection
      let last2DaysTicketsSold = 0;
      let todayCollection = 0;
      let yesterdayCollection = 0;

      movieBookings.forEach((b) => {
        const amount = b.totalAmount || 0;
        const seatsCount = b.seats ? b.seats.length : 0;
        const bDate = b.createdAt || new Date();

        // Total collection till now
        collection += amount;
        ticketsSold += seatsCount;

        // Last 2 days collection
        if (isLast2DaysBooking(bDate)) {
          last2DaysCollection += amount;
          last2DaysTicketsSold += seatsCount;
        }

        if (isTodayBooking(bDate)) {
          todayCollection += amount;
        }

        if (isYesterdayBooking(bDate)) {
          yesterdayCollection += amount;
        }
      });

      const isCreatedByMe = Boolean(
        currentAdminId && movie.createdBy && movie.createdBy.toString() === currentAdminId
      );

      return {
        _id: movie._id,
        title: movie.title,
        description: movie.description,
        posterUrl: movie.posterUrl,
        bannerUrl: movie.bannerUrl,
        genre: movie.genre,
        language: movie.language,
        duration: movie.duration,
        releaseDate: movie.releaseDate,
        director: movie.director,
        cast: movie.cast,
        ticketPrice: movie.ticketPrice,
        rating: movie.rating,
        ratingCount: movie.ratingCount || movieReviews.length,
        showtimes: movie.showtimes || [],
        showtimesCount: movie.showtimes ? movie.showtimes.length : 0,
        isActive: movie.isActive,
        createdBy: movie.createdBy,
        isCreatedByMe,
        // All-Time Records
        totalBookings: movieBookings.length,
        ticketsSold,
        collection, // Total collection till now
        // Last 2 Days Records
        last2DaysCollection,
        last2DaysTicketsSold,
        todayCollection,
        yesterdayCollection,
      };
    });

    // 2-Day Daily breakdown
    const dailyBreakdown = [
      {
        date: startOfToday.toISOString().split('T')[0],
        label: 'Today',
        revenue: todayRevenue,
        ticketsSold: todayTicketsSold,
        bookingsCount: todayBookingsCount,
      },
      {
        date: startOfYesterday.toISOString().split('T')[0],
        label: 'Yesterday',
        revenue: yesterdayRevenue,
        ticketsSold: yesterdayTicketsSold,
        bookingsCount: yesterdayBookingsCount,
      },
    ];

    // All ticket bookings records with 2-day flag
    const recentBookings = bookings.map((b) => {
      const bDate = b.createdAt || new Date();
      return {
        _id: b._id,
        bookingId: b.bookingId,
        userName: b.userName,
        userEmail: b.userEmail,
        movieId: b.movie,
        movieTitle: b.movieTitle,
        screen: b.screen,
        showDate: b.showDate,
        showTime: b.showTime,
        seats: b.seats,
        totalAmount: b.totalAmount,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        createdAt: b.createdAt,
        isLast2Days: isLast2DaysBooking(bDate),
      };
    });

    res.status(200).json({
      success: true,
      currentAdmin: {
        id: req.user?._id,
        name: req.user?.name,
        email: req.user?.email,
      },
      stats: {
        // Total collection till now
        totalRevenue,
        totalTicketsSold,
        totalBookings: bookings.length,
        totalMovies: movies.length,
        // Last 2 days collections
        last2DaysRevenue,
        last2DaysTicketsSold,
        last2DaysBookingsCount,
        // Single day details
        todayRevenue,
        todayTicketsSold,
        todayBookingsCount,
        yesterdayRevenue,
        yesterdayTicketsSold,
        yesterdayBookingsCount,
      },
      dailyBreakdown,
      movieStats,
      recentBookings,
    });
  } catch (error: any) {
    console.error('Error in admin dashboard analytics:', error);
    res.status(500).json({ message: 'Server error retrieving admin analytics' });
  }
});

export default router;
