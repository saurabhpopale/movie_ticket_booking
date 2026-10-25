import mongoose, { Document, Schema } from 'mongoose';

export interface IShowtime {
  _id?: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM"
  screen: string; // e.g. "Audi 1 (IMAX)", "Audi 2 (Dolby Atmos)"
  price: number;
  totalSeats: number;
}

export interface IMovie extends Document {
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  genre: string[];
  language: string;
  duration: number; // in minutes
  releaseDate: Date;
  director: string;
  cast: string[];
  ticketPrice: number;
  rating: number;
  ratingCount: number;
  showtimes: IShowtime[];
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShowtimeSchema = new Schema<IShowtime>({
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  screen: {
    type: String,
    required: true,
    default: 'Audi 1 (Standard)',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSeats: {
    type: Number,
    required: true,
    default: 60, // e.g. 6 rows x 10 seats
  },
});

const MovieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster URL is required'],
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    genre: {
      type: [String],
      required: true,
      default: ['Action'],
    },
    language: {
      type: String,
      default: 'English',
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
    director: {
      type: String,
      default: 'Director',
    },
    cast: {
      type: [String],
      default: [],
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    showtimes: [ShowtimeSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Movie = mongoose.model<IMovie>('Movie', MovieSchema);
