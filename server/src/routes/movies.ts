import { Router, Request, Response } from 'express';
import { Movie } from '../models/Movie.js';
import { Booking } from '../models/Booking.js';
import { protect, adminOnly, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all movies (with optional search, genre, language filters)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, genre, language } = req.query;
    const filter: any = { isActive: true };

    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { cast: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && typeof genre === 'string' && genre !== 'All') {
      filter.genre = { $in: [genre] };
    }

    if (language && typeof language === 'string' && language !== 'All') {
      filter.language = language;
    }

    const movies = await Movie.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: movies.length, movies });
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// GET single movie by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.status(200).json({ success: true, movie });
  } catch (error: any) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

// GET booked seats for a movie's specific showtime and date
router.get('/:id/seats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { showtimeId, showDate } = req.query;

    if (!showtimeId || !showDate) {
      res.status(400).json({ message: 'showtimeId and showDate query parameters are required' });
      return;
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    const showtime = movie.showtimes.find((s) => s._id?.toString() === showtimeId.toString());

    // Find all active bookings for this movie, showtime, and date
    const bookings = await Booking.find({
      movie: id,
      showtimeId: showtimeId.toString(),
      showDate: showDate.toString(),
      paymentStatus: { $ne: 'cancelled' },
    });

    const bookedSeats: string[] = [];
    bookings.forEach((b) => {
      b.seats.forEach((seat) => bookedSeats.push(seat));
    });

    res.status(200).json({
      success: true,
      movieId: id,
      showtimeId,
      showDate,
      showtime,
      totalSeats: showtime ? showtime.totalSeats : 60,
      bookedSeats,
    });
  } catch (error: any) {
    console.error('Error fetching seat map:', error);
    res.status(500).json({ message: 'Error fetching seat availability' });
  }
});

// POST create movie (Admin only)
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      posterUrl,
      bannerUrl,
      trailerUrl,
      genre,
      language,
      duration,
      releaseDate,
      director,
      cast,
      ticketPrice,
      showtimes,
    } = req.body;

    if (!title || !description || !posterUrl || !duration || !ticketPrice) {
      res.status(400).json({
        message: 'Please provide all required fields: title, description, posterUrl, duration, ticketPrice',
      });
      return;
    }

    // Process genres
    const parsedGenre = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Action'];

    // Process cast
    const parsedCast = Array.isArray(cast)
      ? cast
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    // Default showtimes if none provided
    let finalShowtimes = showtimes;
    if (!finalShowtimes || !Array.isArray(finalShowtimes) || finalShowtimes.length === 0) {
      const today = new Date();
      finalShowtimes = [];
      const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        times.forEach((t, idx) => {
          finalShowtimes.push({
            date: dateStr,
            time: t,
            screen: idx % 2 === 0 ? 'Screen 1 (IMAX)' : 'Screen 2 (Dolby Atmos)',
            price: Number(ticketPrice),
            totalSeats: 60,
          });
        });
      }
    } else {
      // If custom showtimes provided, ensure clean format without invalid ObjectId strings
      finalShowtimes = finalShowtimes.map((st: any) => ({
        date: st.date,
        time: st.time,
        screen: st.screen || 'Screen 1 (IMAX)',
        price: Number(st.price || ticketPrice),
        totalSeats: Number(st.totalSeats || 60),
      }));
    }

    const movie = await Movie.create({
      title: title.trim(),
      description: description.trim(),
      posterUrl: posterUrl.trim(),
      bannerUrl: bannerUrl ? bannerUrl.trim() : posterUrl.trim(),
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      genre: parsedGenre,
      language: language || 'English',
      duration: Number(duration),
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      director: director || 'Director',
      cast: parsedCast,
      ticketPrice: Number(ticketPrice),
      showtimes: finalShowtimes,
      isActive: true,
      createdBy: req.user!._id,
    });

    res.status(201).json({
      success: true,
      message: 'Movie posted successfully!',
      movie,
    });
  } catch (error: any) {
    console.error('Error creating movie:', error);
    res.status(500).json({ message: error.message || 'Server error creating movie' });
  }
});

// PUT update movie (Admin only)
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    // Process array fields if passed as strings
    if (req.body.genre && typeof req.body.genre === 'string') {
      req.body.genre = req.body.genre.split(',').map((g: string) => g.trim()).filter(Boolean);
    }
    if (req.body.cast && typeof req.body.cast === 'string') {
      req.body.cast = req.body.cast.split(',').map((c: string) => c.trim()).filter(Boolean);
    }

    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      movie: updatedMovie,
    });
  } catch (error: any) {
    console.error('Error updating movie:', error);
    res.status(500).json({ message: error.message || 'Server error updating movie' });
  }
});

// DELETE movie (Admin only)
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Movie removed successfully' });
  } catch (error: any) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ message: 'Server error deleting movie' });
  }
});

// PATCH toggle movie active status (Admin only)
router.patch('/:id/toggle-status', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    movie.isActive = !movie.isActive;
    await movie.save();

    res.status(200).json({
      success: true,
      message: `Movie "${movie.title}" status changed to ${movie.isActive ? 'Active' : 'Inactive'}`,
      movie,
    });
  } catch (error: any) {
    console.error('Error toggling movie status:', error);
    res.status(500).json({ message: error.message || 'Server error toggling status' });
  }
});

export default router;
