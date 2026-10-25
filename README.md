# 🎬 CinePass - MERN Stack Movie Ticket Booking Platform

A full-stack cinema ticketing and movie discovery web application built with the **MERN Stack** (MongoDB, Express, React, Node.js), **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

### 🔐 1. Two-Step Email & OTP Authentication
- **Secure Registration**: Two account roles during signup:
  - 🎟️ **Normal User (Moviegoer)**: Browse films, book seats, view & submit audience ratings, manage digital tickets.
  - 👑 **Cinema Admin**: Post new movies with showtimes, monitor box office revenue collections, view film ratings, and track live customer bookings. Includes secret passkey validation (`admin123`).
- **Two-Step Login & Signup**:
  - Step 1: Email and password verification.
  - Step 2: 6-digit one-time code (OTP) verification with 10-minute expiration.
  - **Dev Mode OTP Helper**: In development, OTP is printed clearly in the terminal and displayed in an on-screen helper banner with a 1-click copy feature.
  - Supports production SMTP delivery via Nodemailer when configured.

### 🎥 2. Admin Movie & Box Office Management
- **Post Movies**: Add title, synopsis, poster & banner images, YouTube trailer link, genres, language, duration, ticket price, director, and cast.
- **Showtimes Scheduler**: Automatically generates showtimes across multiple screens (IMAX Laser, Dolby Atmos, VIP Recliner).
- **Box Office Analytics Dashboard**:
  - Total cinema revenue collection.
  - Total tickets / seats sold.
  - Total confirmed bookings count.
  - Total movies in circulation.
  - Per-movie performance table: total collection, ticket sales, showtime counts, and average star ratings.
  - Recent live bookings feed with customer name, seats reserved, screen, and amount paid.
  - Delete or unpublish movies.

### 🎟️ 3. Interactive Cinema Ticketing & Seat Reservation
- **Live Auditorium Seat Map**:
  - Curved projection screen header with glowing cinema light effect.
  - Multi-tier seating layout: **VIP Lounge** (Rows A-B), **Executive / Dolby** (Rows C-D), and **Standard** (Rows E-F).
  - Real-time seat statuses: Available, Selected, and Booked/Occupied.
  - Dynamic price computation based on seat tiers.
  - Seat collision prevention: prevents duplicate reservations for the same showtime.
- **Instant Digital Tickets**:
  - Perforated cinema ticket stub design.
  - QR code and barcode simulation for gate entry.
  - Print/Save ticket option.
  - Confetti celebration upon successful booking!

### ⭐ 4. Community Ratings & Reviews
- **Audience Ratings**: 1 to 5 star rating picker with verified audience feedback.
- **Real-Time Recalculation**: Submitting a review recalculates the film's average rating and updates the scorecard immediately.
- **Audience Scorecard**: Visual 5-star distribution bar breakdown.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Lucide React (Icons)
  - React Router DOM v6
  - Axios
  - Canvas Confetti
- **Backend**:
  - Node.js & Express
  - TypeScript & TSX
  - Mongoose & MongoDB (with automatic `mongodb-memory-server` fallback for zero-config local testing)
  - JSON Web Tokens (JWT) & BcryptJS
  - Nodemailer (Email & OTP delivery)
  - CORS & Dotenv

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm or yarn

### 1. Installation
In the project root directory:
```bash
# Install root orchestrator dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### 2. Environment Variables

The project uses environment variables in both `server/` and `client/`. Template files (`.env.example`) are provided.

#### Backend Configuration (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_cinepass_jwt_token_key_2026
ADMIN_SECRET_KEY=admin123

# MongoDB Atlas URI (if omitted, in-memory MongoDB starts automatically for dev)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/ticket_booking?retryWrites=true&w=majority

# Optional: Real SMTP email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="CinePass <your_email@gmail.com>"

# Optional: Razorpay Payment Gateway (Test or Live)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

#### Frontend Configuration (`client/.env`):
```env
# In local development:
VITE_API_URL=http://localhost:5000

# In production deployment (e.g. Render/Railway):
# VITE_API_URL=https://your-backend-api.onrender.com
```

### 3. Run Development Servers
Start both backend (port 5000) and frontend (port 5173) concurrently:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1 - Backend Server
npm run dev --prefix server

# Terminal 2 - Frontend Client
npm run dev --prefix client
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🔑 Demo Indian Accounts (Pre-Seeded)

The database is pre-seeded with blockbuster Indian movies (across Hindi, Telugu, and Kannada), comprehensive showtimes, verified audience reviews, and demo Indian accounts:

### 👑 Indian Cinema Admins
| Name | Role | Email | Password | OTP |
|---|---|---|---|---|
| **Rajesh Sharma** | Lead Cinema Admin | `admin@cinepass.com` | `adminpassword123` | Check terminal or on-screen banner |
| **Priya Patel** | Operations & Programming Lead | `priya.admin@cinepass.com` | `adminpassword123` | Check terminal or on-screen banner |
| **Arjun Mehta** | Multiplex & Screenings Manager | `arjun.admin@cinepass.com` | `adminpassword123` | Check terminal or on-screen banner |

### 🎟️ Indian Moviegoers (Customers)
| Name | Email | Password | OTP |
|---|---|---|---|
| **Aarav Mehta** | `alex@example.com` | `userpassword123` | Check terminal or on-screen banner |
| **Ananya Sharma** | `ananya.sharma@example.com` | `userpassword123` | Check terminal or on-screen banner |
| **Rohan Verma** | `rohan.verma@example.com` | `userpassword123` | Check terminal or on-screen banner |
| **Sneha Kulkarni** | `sneha.kulkarni@example.com` | `userpassword123` | Check terminal or on-screen banner |
| **Vikramaditya Rao** | `vikram.rao@example.com` | `userpassword123` | Check terminal or on-screen banner |

> **Admin Signup Secret Key**: When signing up a new Admin user, use the passkey: `admin123`.

---

## 🇮🇳 Pre-Seeded Indian Cinema Titles
- **RRR (Rise Roar Revolt)** (Telugu / Pan-India) – Dir. S. S. Rajamouli
- **Jawan** (Hindi) – Dir. Atlee
- **Kalki 2898 AD** (Telugu / Pan-India) – Dir. Nag Ashwin
- **Stree 2: Sarkate Ka Aatank** (Hindi) – Dir. Amar Kaushik
- **K.G.F: Chapter 2** (Kannada) – Dir. Prashanth Neel
- **Baahubali 2: The Conclusion** (Telugu / Pan-India) – Dir. S. S. Rajamouli
- **12th Fail** (Hindi) – Dir. Vidhu Vinod Chopra
- **Kantara: A Legend** (Kannada) – Dir. Rishab Shetty
- **Dangal** (Hindi) – Dir. Nitesh Tiwari

---

## 📁 Project Structure

```
movies_ticket_booking/
├── .env.example                # Full environment reference template
├── .gitignore                  # Git ignore rules (protects credentials & node_modules)
├── client/                     # Frontend Vite + React + TS + Tailwind
│   ├── .env.example            # Client env template (VITE_API_URL)
│   ├── vercel.json             # Vercel SPA rewrite rules
│   ├── public/_redirects       # Netlify SPA redirect rules
│   ├── src/
│   │   ├── api/                # Axios API client & endpoints
│   │   ├── components/         # Navbar, Footer, SeatMap, TicketCard, MovieCard, DevOtpBanner, RatingModal, ProtectedRoute
│   │   ├── context/            # AuthContext (2-step OTP state & session management)
│   │   ├── pages/              # Home, Movies, MovieDetails, BookSeats, MyBookings, Login, Signup
│   │   │   └── admin/          # AdminDashboard & PostMovie studio
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # React DOM mounting
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Backend Express + TS + MongoDB
│   ├── .env.example            # Server env template (PORT, CLIENT_URL, MONGODB_URI, etc.)
│   ├── src/
│   │   ├── config/             # MongoDB connection (with MongoMemoryServer fallback)
│   │   ├── middleware/         # JWT auth & admin guard
│   │   ├── models/             # User, Otp, Movie, Booking, Review schemas
│   │   ├── routes/             # Auth, Movies, Bookings, Reviews, Admin
│   │   ├── utils/              # Email & OTP dispatcher, ticket printing
│   │   ├── seed.ts             # Sample blockbuster data seeder
│   │   └── index.ts            # Server entry point & production SPA static server
│   ├── tsconfig.json
│   └── package.json
└── package.json                # Root build, dev, start, & postinstall scripts
```

---

## 🚢 Deployment Guide

### Step 1: Push to GitHub

1. Ensure your local changes are committed:
   ```bash
   git add .
   git commit -m "feat: complete MERN movie ticket booking platform with deployment setup"
   ```

2. Create a new repository on GitHub (e.g. `movies-ticket-booking`).

3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

> ⚠️ **Security Guarantee**: Your `.gitignore` is already configured. Real `.env` files containing database passwords, SMTP credentials, and Razorpay secrets are **never** committed to GitHub.

---

### Step 2: Deploy Backend & Database

#### Option A: Render.com (Recommended Web Service)
1. Sign in to [Render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the build settings:
   - **Root Directory**: `server` (or leave blank if deploying full-stack monorepo)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://your-frontend.vercel.app` (your frontend domain)
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ticket_booking`
   - `JWT_SECRET`: `your_random_jwt_secret_key`
   - `ADMIN_SECRET_KEY`: `admin123`
   - `RESEND_API_KEY`: `re_your_resend_api_key` *(Recommended for Render: Render Free Tier blocks SMTP ports 465 & 587. Resend works over HTTPS port 443 with 3,000 free emails/month at [resend.com](https://resend.com))*
   - `SMTP_USER`: `your_email@gmail.com` *(Optional / fallback)*
   - `SMTP_PASS`: `your_gmail_app_password` *(Optional / fallback)*
   - `RAZORPAY_KEY_ID`: `your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET`: `your_razorpay_secret`

---

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended)
1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your GitHub repository.
3. Set **Root Directory** to `client`.
4. Framework Preset: **Vite**.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com`
6. Click **Deploy**. Vercel will automatically read `client/vercel.json` and build your SPA!

#### Option B: Single Full-Stack Service (Render / Railway Monorepo)
The Express server in `server/src/index.ts` is configured to automatically serve the compiled frontend (`client/dist`) in production.
- **Root Build Command**: `npm run build`
- **Root Start Command**: `npm start`
- With this setup, both the API (`/api/*`) and the React UI (`/*`) run on a single domain.
