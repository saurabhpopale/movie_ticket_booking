import { Router, Request, Response } from 'express';
import { Review } from '../models/Review.js';
import { Movie } from '../models/Movie.js';
import { protect, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to recalculate and update movie rating
const recalculateMovieRating = async (movieId: string): Promise<void> => {
  const reviews = await Review.find({ movie: movieId });
  if (reviews.length === 0) {
    await Movie.findByIdAndUpdate(movieId, { rating: 0, ratingCount: 0 });
    return;
  }

  const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const average = Number((sum / reviews.length).toFixed(1));

  await Movie.findByIdAndUpdate(movieId, {
    rating: average,
    ratingCount: reviews.length,
  });
};

// GET all reviews for a movie
router.get('/movie/:movieId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movie: movieId }).sort({ createdAt: -1 });

    // Rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      distribution,
      reviews,
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error retrieving reviews' });
  }
});

// POST submit or update review for a movie
router.post('/movie/:movieId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    if (!comment || comment.trim().length === 0) {
      res.status(400).json({ message: 'Review comment cannot be empty' });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }

    // Check if user has already reviewed this movie -> update
    let review = await Review.findOne({ movie: movieId, user: req.user!._id });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment.trim();
      review.userName = req.user!.name;
      await review.save();
    } else {
      review = await Review.create({
        movie: movie._id,
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        rating: Number(rating),
        comment: comment.trim(),
      });
    }

    // Recalculate average movie rating
    await recalculateMovieRating(movieId);

    const updatedMovie = await Movie.findById(movieId);

    res.status(200).json({
      success: true,
      message: 'Thank you! Your rating and review have been recorded.',
      review,
      movieRating: updatedMovie?.rating,
      movieRatingCount: updatedMovie?.ratingCount,
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: error.message || 'Server error recording review' });
  }
});

// DELETE review
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Only owner or admin can delete
    if (review.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Access denied to delete this review' });
      return;
    }

    const movieId = review.movie.toString();
    await Review.findByIdAndDelete(req.params.id);

    await recalculateMovieRating(movieId);

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
});

export default router;
