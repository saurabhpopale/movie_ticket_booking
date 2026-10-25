import { Router, Request, Response } from 'express';
import { Booking } from '../models/Booking.js';
import { Movie } from '../models/Movie.js';
import { protect, AuthRequest } from '../middleware/auth.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
} from '../utils/razorpay.js';

const router = Router();

const TIER_SURCHARGES: Record<string, number> = {
  A: 100,
  B: 100,
  C: 50,
  D: 50,
  E: 0,
  F: 0,
};

const calculateTotalAmount = (basePrice: number, seats: string[]): number => {
  const seatsTotal = seats.reduce((sum, seat) => {
    const row = seat.charAt(0).toUpperCase();
    const surcharge = TIER_SURCHARGES[row] || 0;
    return sum + (basePrice + surcharge);
  }, 0);
  const bookingFee = seats.length > 0 ? 30 : 0;
  return seatsTotal + bookingFee;
};

// ==========================================
// RAZORPAY INTEGRATION ROUTES
// ==========================================

// GET Razorpay Public Key ID
router.get('/razorpay/key', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    keyId: getRazorpayKeyId(),
  });
});

// POST Create Razorpay Order
router.post('/razorpay/create-order', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      res.status(403).json({ message: 'Administrators are not permitted to book tickets.' });
      return;
    }

    const { movieId, showtimeId, showDate, seats } = req.body;

    if (!movieId || !showtimeId || !showDate || !seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ message: 'movieId, showtimeId, showDate, and at least one seat are required' });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    const showtime = movie.showtimes.find((s) => s._id?.toString() === showtimeId.toString());
    if (!showtime) {
      res.status(404).json({ message: 'Selected showtime does not exist for this movie' });
      return;
    }

    // Check if any of the selected seats are already booked
    const existingBookings = await Booking.find({
      movie: movieId,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      paymentStatus: { $ne: 'cancelled' },
      seats: { $in: seats },
    });

    if (existingBookings.length > 0) {
      const takenSeats: string[] = [];
      existingBookings.forEach((b) => {
        b.seats.forEach((seat) => {
          if (seats.includes(seat) && !takenSeats.includes(seat)) {
            takenSeats.push(seat);
          }
        });
      });

      res.status(400).json({
        message: `The following seat(s) are already booked: ${takenSeats.join(', ')}. Please choose other seats.`,
      });
      return;
    }

    const basePrice = showtime.price || movie.ticketPrice;
    const grandTotal = calculateTotalAmount(basePrice, seats);
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const { order, isSimulated } = await createRazorpayOrder(grandTotal, receipt, {
      movieId: movie._id.toString(),
      movieTitle: movie.title,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      seats: seats.join(','),
      userId: req.user!._id.toString(),
    });

    res.status(200).json({
      success: true,
      order,
      keyId: getRazorpayKeyId(),
      amount: grandTotal,
      currency: 'INR',
      isSimulated,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: error.message || 'Server error creating Razorpay order' });
  }
});

// POST Verify Razorpay Payment and confirm booking
router.post('/razorpay/verify-payment', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      res.status(403).json({ message: 'Administrators are not permitted to book tickets.' });
      return;
    }

    const {
      movieId,
      showtimeId,
      showDate,
      seats,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod = 'Razorpay (UPI / Card)',
    } = req.body;

    if (!movieId || !showtimeId || !showDate || !seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ message: 'movieId, showtimeId, showDate, and seats are required' });
      return;
    }

    if (!razorpayOrderId || !razorpayPaymentId) {
      res.status(400).json({ message: 'Razorpay order ID and payment ID are required' });
      return;
    }

    // Verify cryptographic signature
    const isValidSignature = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature || ''
    );

    if (!isValidSignature) {
      res.status(400).json({ message: 'Razorpay payment verification failed: Invalid transaction signature' });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    const showtime = movie.showtimes.find((s) => s._id?.toString() === showtimeId.toString());
    if (!showtime) {
      res.status(404).json({ message: 'Selected showtime does not exist for this movie' });
      return;
    }

    // Concurrency check: make sure seats haven't been booked by another user while paying
    const existingBookings = await Booking.find({
      movie: movieId,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      paymentStatus: { $ne: 'cancelled' },
      seats: { $in: seats },
    });

    if (existingBookings.length > 0) {
      const takenSeats: string[] = [];
      existingBookings.forEach((b) => {
        b.seats.forEach((seat) => {
          if (seats.includes(seat) && !takenSeats.includes(seat)) {
            takenSeats.push(seat);
          }
        });
      });

      res.status(400).json({
        message: `Seats ${takenSeats.join(', ')} were already booked during payment processing.`,
      });
      return;
    }

    const basePrice = showtime.price || movie.ticketPrice;
    const grandTotal = calculateTotalAmount(basePrice, seats);
    const bookingId = `CNP-${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await Booking.create({
      bookingId,
      user: req.user!._id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      movie: movie._id,
      movieTitle: movie.title,
      moviePoster: movie.posterUrl,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      showTime: showtime.time,
      screen: showtime.screen,
      seats,
      totalAmount: grandTotal,
      paymentStatus: 'completed',
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || '',
    });

    console.log(`🎟️ Booking confirmed via Razorpay: ${booking.bookingId} for ${booking.userName} (Payment: ${razorpayPaymentId})`);

    res.status(201).json({
      success: true,
      message: 'Payment verified and tickets booked successfully!',
      booking,
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ message: error.message || 'Server error verifying Razorpay payment' });
  }
});

// ==========================================
// STANDARD DIRECT BOOKING ROUTE
// ==========================================

// POST create a new direct booking
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      res.status(403).json({ message: 'Administrators are not permitted to book tickets.' });
      return;
    }

    const { movieId, showtimeId, showDate, seats, paymentMethod = 'Credit Card' } = req.body;

    if (!movieId || !showtimeId || !showDate || !seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ message: 'movieId, showtimeId, showDate, and at least one seat are required' });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    const showtime = movie.showtimes.find((s) => s._id?.toString() === showtimeId.toString());
    if (!showtime) {
      res.status(404).json({ message: 'Selected showtime does not exist for this movie' });
      return;
    }

    // Check if any of the selected seats are already booked
    const existingBookings = await Booking.find({
      movie: movieId,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      paymentStatus: { $ne: 'cancelled' },
      seats: { $in: seats },
    });

    if (existingBookings.length > 0) {
      const takenSeats: string[] = [];
      existingBookings.forEach((b) => {
        b.seats.forEach((seat) => {
          if (seats.includes(seat) && !takenSeats.includes(seat)) {
            takenSeats.push(seat);
          }
        });
      });

      res.status(400).json({
        message: `The following seat(s) are already booked: ${takenSeats.join(', ')}. Please choose other seats.`,
      });
      return;
    }

    const basePrice = showtime.price || movie.ticketPrice;
    const totalAmount = calculateTotalAmount(basePrice, seats);
    const bookingId = `CNP-${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await Booking.create({
      bookingId,
      user: req.user!._id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      movie: movie._id,
      movieTitle: movie.title,
      moviePoster: movie.posterUrl,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      showTime: showtime.time,
      screen: showtime.screen,
      seats,
      totalAmount,
      paymentStatus: 'completed',
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully!',
      booking,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: error.message || 'Server error creating booking' });
  }
});

// GET current user's bookings
router.get('/my-bookings', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find({ user: req.user!._id })
      .populate('movie', 'title posterUrl duration language')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
});

// GET single booking by ID or bookingId
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let booking = await Booking.findById(id).populate('movie');

    if (!booking) {
      booking = await Booking.findOne({ bookingId: id }).populate('movie');
    }

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Verify ownership or admin
    if (booking.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Access denied to this booking' });
      return;
    }

    res.status(200).json({ success: true, booking });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error retrieving booking' });
  }
});

export default router;
