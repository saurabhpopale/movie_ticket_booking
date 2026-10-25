import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { Movie } from './models/Movie.js';
import { Booking } from './models/Booking.js';
import { Review } from './models/Review.js';

dotenv.config();

export const seedDatabase = async (disconnectAfter = true) => {
  console.log('🌱 Starting Database Seeding with Indian Cinema Dataset & Indian Users...');
  await connectDB();

  try {
    // Clear existing collections
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});

    // 1. Create Indian Admin Users
    const primaryAdmin = await User.create({
      name: 'Rajesh Sharma',
      email: 'admin@cinepass.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });

    const secondaryAdmin = await User.create({
      name: 'Priya Patel',
      email: 'priya.admin@cinepass.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });

    const operationsAdmin = await User.create({
      name: 'Arjun Mehta',
      email: 'arjun.admin@cinepass.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });

    const ownerAdmin = await User.create({
      name: 'Saurabh Popale',
      email: 'saurabhpopale720@gmail.com',
      password: 'adminpassword123',
      role: 'admin',
      isVerified: true,
    });

    // 2. Create Indian Customer Users
    const customer1 = await User.create({
      name: 'Aarav Mehta',
      email: 'alex@example.com', // Aliased for demo compatibility
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer2 = await User.create({
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer3 = await User.create({
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer4 = await User.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer5 = await User.create({
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer6 = await User.create({
      name: 'Neha Gupta',
      email: 'neha.gupta@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    const customer7 = await User.create({
      name: 'Kabir Deshmukh',
      email: 'kabir.deshmukh@example.com',
      password: 'userpassword123',
      role: 'user',
      isVerified: true,
    });

    console.log('✅ Created Indian Admin & Customer Users:');
    console.log('   👑 Lead Admin:     admin@cinepass.com (Rajesh Sharma) / adminpassword123');
    console.log('   👑 Operations Lead: priya.admin@cinepass.com (Priya Patel) / adminpassword123');
    console.log('   👑 Multiplex Lead:  arjun.admin@cinepass.com (Arjun Mehta) / adminpassword123');
    console.log('   🎟️ Customer 1:     alex@example.com (Aarav Mehta) / userpassword123');
    console.log('   🎟️ Customer 2:     ananya.sharma@example.com (Ananya Sharma) / userpassword123');
    console.log('   🎟️ Customer 3:     rohan.verma@example.com (Rohan Verma) / userpassword123');
    console.log('   🎟️ Customer 4:     sneha.kulkarni@example.com (Sneha Kulkarni) / userpassword123');
    console.log('   🎟️ Customer 5:     vikram.rao@example.com (Vikramaditya Rao) / userpassword123');

    // Generate dates for the next 7 days
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const createShowtimes = (basePrice: number) => {
      const showtimes = [];
      const times = [
        { time: '10:30 AM', screen: 'Screen 1 (IMAX Laser)', price: basePrice + 80 },
        { time: '01:45 PM', screen: 'Screen 2 (Dolby Atmos)', price: basePrice },
        { time: '05:15 PM', screen: 'Screen 1 (IMAX Laser)', price: basePrice + 80 },
        { time: '08:30 PM', screen: 'Screen 3 (VIP Recliner)', price: basePrice + 150 },
        { time: '11:00 PM', screen: 'Screen 2 (Dolby Atmos)', price: basePrice },
      ];

      for (const date of dates) {
        for (const t of times) {
          showtimes.push({
            date,
            time: t.time,
            screen: t.screen,
            price: t.price,
            totalSeats: 60,
          });
        }
      }
      return showtimes;
    };

    // 3. Indian Blockbuster Movies
    const moviesData = [
      {
        title: 'RRR (Rise Roar Revolt)',
        description:
          'A tale of two legendary revolutionaries—Alluri Sitarama Raju and Komaram Bheem—and their journey far from home fighting British colonialists in 1920s India.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=GY4BgdUSpbE',
        genre: ['Action', 'Drama', 'Period'],
        language: 'Telugu',
        duration: 187,
        releaseDate: new Date('2022-03-25'),
        director: 'S. S. Rajamouli',
        cast: ['N. T. Rama Rao Jr.', 'Ram Charan', 'Alia Bhatt', 'Ajay Devgn', 'Shriya Saran'],
        ticketPrice: 350,
        rating: 4.9,
        ratingCount: 32,
        showtimes: createShowtimes(350),
        isActive: true,
      },
      {
        title: 'Jawan',
        description:
          'A high-octane emotional action thriller outlining the journey of Vikram Rathore and Azad, a prison warden driven by a personal vendetta to rectify societal and systemic corruption across the nation.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/lPUrfzWb7icGC6X1z0AKnYRtHGu.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=COv52Qyctws',
        genre: ['Action', 'Thriller', 'Drama'],
        language: 'Hindi',
        duration: 169,
        releaseDate: new Date('2023-09-07'),
        director: 'Atlee',
        cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi', 'Deepika Padukone', 'Sanya Malhotra'],
        ticketPrice: 300,
        rating: 4.8,
        ratingCount: 28,
        showtimes: createShowtimes(300),
        isActive: true,
      },
      {
        title: 'Kalki 2898 AD',
        description:
          'Set in a dystopian post-apocalyptic future in the year 2898 AD in Kasi, the immortal warrior Ashwatthama embarks on a celestial mission to protect the unborn child of SUM-80, the prophesied avatar Kalki.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=y1-w1GQ8_5k',
        genre: ['Sci-Fi', 'Action', 'Mythology'],
        language: 'Telugu',
        duration: 181,
        releaseDate: new Date('2024-06-27'),
        director: 'Nag Ashwin',
        cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone', 'Disha Patani'],
        ticketPrice: 350,
        rating: 4.7,
        ratingCount: 24,
        showtimes: createShowtimes(350),
        isActive: true,
      },
      {
        title: 'Stree 2: Sarkate Ka Aatank',
        description:
          'After the legend of Stree brings peace, the town of Chanderi faces a new demonic menace: "Sarkata", a headless entity abducting progressive women. Vicky and his loyal gang must join forces with Stree to save the town.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/nfnhwfUEFuSOxxf4jDdBlY6Lccw.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=KVnhe9A0wIE',
        genre: ['Comedy', 'Horror'],
        language: 'Hindi',
        duration: 147,
        releaseDate: new Date('2024-08-15'),
        director: 'Amar Kaushik',
        cast: ['Shraddha Kapoor', 'Rajkummar Rao', 'Pankaj Tripathi', 'Aparshakti Khurana', 'Abhishek Banerjee'],
        ticketPrice: 250,
        rating: 4.8,
        ratingCount: 26,
        showtimes: createShowtimes(250),
        isActive: true,
      },
      {
        title: 'K.G.F: Chapter 2',
        description:
          'The blood-soaked realm of Kolar Gold Fields now belongs to Rocky Bhai. But with his allies growing nervous and ruthless rivals like Adheera and Inayat Khalil closing in, an epic war for gold dominance unfolds.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/khNVygolU0TxLIDWff5tQlAhZ23.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/nsV5Mfi9FAV4w8eDsdr7uqVswOk.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=JKa05nyUmuQ',
        genre: ['Action', 'Crime', 'Drama'],
        language: 'Kannada',
        duration: 168,
        releaseDate: new Date('2022-04-14'),
        director: 'Prashanth Neel',
        cast: ['Yash', 'Sanjay Dutt', 'Raveena Tandon', 'Srinidhi Shetty', 'Prakash Raj'],
        ticketPrice: 300,
        rating: 4.9,
        ratingCount: 30,
        showtimes: createShowtimes(300),
        isActive: true,
      },
      {
        title: 'Baahubali 2: The Conclusion',
        description:
          'When Shiva, the son of Bahubali, learns about his royal heritage, he embarks on an unforgettable quest to avenge the betrayal of his father and liberate the kingdom of Mahishmati from the tyrannical Bhallaladeva.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/yCRYYGldFGVa4cmZVpTVCRQMfjA.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=G62HrubdD6o',
        genre: ['Action', 'Drama', 'Epic'],
        language: 'Telugu',
        duration: 167,
        releaseDate: new Date('2017-04-28'),
        director: 'S. S. Rajamouli',
        cast: ['Prabhas', 'Rana Daggubati', 'Anushka Shetty', 'Tamannaah Bhatia', 'Ramya Krishnan', 'Sathyaraj'],
        ticketPrice: 300,
        rating: 4.9,
        ratingCount: 35,
        showtimes: createShowtimes(300),
        isActive: true,
      },
      {
        title: '12th Fail',
        description:
          'The deeply moving true journey of Manoj Kumar Sharma, who rose from poverty and academic failure in Chambal to conquer India\'s hardest UPSC civil services examination through honesty and sheer perseverance.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=we_nK9BfZ_I',
        genre: ['Biography', 'Drama'],
        language: 'Hindi',
        duration: 147,
        releaseDate: new Date('2023-10-27'),
        director: 'Vidhu Vinod Chopra',
        cast: ['Vikrant Massey', 'Medha Shankr', 'Anant V Joshi', 'Anshumaan Pushkar', 'Priiyanshu Chatterjee'],
        ticketPrice: 220,
        rating: 5.0,
        ratingCount: 38,
        showtimes: createShowtimes(220),
        isActive: true,
      },
      {
        title: 'Kantara: A Legend',
        description:
          'Set in the coastal woods of Karnataka, a clash between forest officer Murali and rebel villager Shiva escalates into a divine reckoning rooted in ancestral spirit worship, Bhoota Kola, and local folklore.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=8mrVmf246U4',
        genre: ['Action', 'Thriller', 'Drama'],
        language: 'Kannada',
        duration: 148,
        releaseDate: new Date('2022-09-30'),
        director: 'Rishab Shetty',
        cast: ['Rishab Shetty', 'Sapthami Gowda', 'Kishore', 'Achyuth Kumar', 'Pramod Shetty'],
        ticketPrice: 260,
        rating: 4.8,
        ratingCount: 22,
        showtimes: createShowtimes(260),
        isActive: true,
      },
      {
        title: 'Dangal',
        description:
          'Former wrestler Mahavir Singh Phogat trains his daughters Geeta and Babita against all patriarchal societal odds, coaching them to win India\'s first-ever Commonwealth wrestling gold medals.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/original/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=x_7YlGv9u1g',
        genre: ['Biography', 'Drama', 'Sport'],
        language: 'Hindi',
        duration: 161,
        releaseDate: new Date('2016-12-23'),
        director: 'Nitesh Tiwari',
        cast: ['Aamir Khan', 'Sakshi Tanwar', 'Fatima Sana Shaikh', 'Sanya Malhotra', 'Aparshakti Khurana'],
        ticketPrice: 240,
        rating: 4.9,
        ratingCount: 29,
        showtimes: createShowtimes(240),
        isActive: true,
      },
    ];

    const moviesDataWithAdmin = moviesData.map((m) => ({
      ...m,
      createdBy: primaryAdmin._id,
    }));

    const createdMovies = await Movie.insertMany(moviesDataWithAdmin);
    console.log(`✅ Seeded ${createdMovies.length} Indian blockbuster movies with full showtimes.`);

    // 4. Create Initial Verified Reviews by Indian Moviegoers
    const rrr = createdMovies[0];
    const jawan = createdMovies[1];
    const kalki = createdMovies[2];
    const stree2 = createdMovies[3];
    const kgf2 = createdMovies[4];
    const baahubali2 = createdMovies[5];
    const fail12 = createdMovies[6];
    const kantara = createdMovies[7];
    const dangal = createdMovies[8];

    const sampleReviews = [
      {
        movie: rrr._id,
        user: customer1._id,
        userName: customer1.name,
        userEmail: customer1.email,
        rating: 5,
        comment:
          'The Naatu Naatu sequence and interval animal entry gave literal goosebumps! S.S. Rajamouli has taken Indian cinema to the global pinnacle. Best IMAX experience ever!',
      },
      {
        movie: rrr._id,
        user: customer2._id,
        userName: customer2.name,
        userEmail: customer2.email,
        rating: 5,
        comment:
          'Ram Charan and Jr NTR delivered sheer cinematic brilliance. The emotional bond between Raju and Bheem anchors this colossal spectacle.',
      },
      {
        movie: jawan._id,
        user: customer3._id,
        userName: customer3.name,
        userEmail: customer3.email,
        rating: 5,
        comment:
          'King Khan in a dual avatar is unadulterated mass hysteria! Anirudh’s background score elevates every single sequence. Absolute theater dynamite.',
      },
      {
        movie: jawan._id,
        user: customer4._id,
        userName: customer4.name,
        userEmail: customer4.email,
        rating: 5,
        comment:
          'Deepika Padukone’s cameo and Nayanthara’s entry were so powerful. Atlee has mastered mass cinema with a meaningful social conscience.',
      },
      {
        movie: kalki._id,
        user: customer5._id,
        userName: customer5.name,
        userEmail: customer5.email,
        rating: 5,
        comment:
          'Amitabh Bachchan as Ashwatthama steals the show! World-class VFX, futuristic dystopian setting, and seamless Mahabharata mythology.',
      },
      {
        movie: stree2._id,
        user: customer2._id,
        userName: customer2.name,
        userEmail: customer2.email,
        rating: 5,
        comment:
          'Laughed from start to finish! Rajkummar Rao, Pankaj Tripathi, and Shraddha Kapoor are hilarious, and the Sarkata ghost effects are truly eerie.',
      },
      {
        movie: kgf2._id,
        user: customer3._id,
        userName: customer3.name,
        userEmail: customer3.email,
        rating: 5,
        comment:
          'Rocky Bhai’s swag is off the charts. The Kalashnikov shootout and the climax are etched into Indian cinema history!',
      },
      {
        movie: baahubali2._id,
        user: customer4._id,
        userName: customer4.name,
        userEmail: customer4.email,
        rating: 5,
        comment:
          'The magnum opus of Indian cinema. Prabhas as Amarendra Baahubali embodies nobility and valor. Hansa Naava visual sequence is pure poetry.',
      },
      {
        movie: fail12._id,
        user: customer1._id,
        userName: customer1.name,
        userEmail: customer1.email,
        rating: 5,
        comment:
          '#Restart! Vikrant Massey’s raw authenticity brought tears to our eyes. Easily the most inspirational Indian film of the decade.',
      },
      {
        movie: fail12._id,
        user: customer6._id,
        userName: customer6.name,
        userEmail: customer6.email,
        rating: 5,
        comment:
          'Every student and young professional in India must watch this masterpiece. Vidhu Vinod Chopra’s storytelling touched our souls.',
      },
      {
        movie: kantara._id,
        user: customer5._id,
        userName: customer5.name,
        userEmail: customer5.email,
        rating: 5,
        comment:
          'Rishab Shetty’s climax performance is spiritual trance incarnate. The Bhoota Kola folklore and Varaha Roopam score are unforgettable.',
      },
      {
        movie: dangal._id,
        user: customer6._id,
        userName: customer6.name,
        userEmail: customer6.email,
        rating: 5,
        comment:
          'Inspiring, patriotic, and intensely emotional. Aamir Khan proves why he is India’s greatest perfectionist.',
      },
    ];

    await Review.insertMany(sampleReviews);
    console.log(`✅ Seeded ${sampleReviews.length} verified Indian audience reviews.`);

    // 5. Create Realistic Initial Bookings for Box Office Collection
    // Spans today, yesterday, and earlier dates for rich analytics
    const todayDate = new Date();
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDaysAgoDate = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const rrrShow1 = (rrr.showtimes[0] as any);
    const rrrShow2 = (rrr.showtimes[2] as any);
    const jawanShow = (jawan.showtimes[1] as any);
    const kalkiShow = (kalki.showtimes[3] as any);
    const streeShow = (stree2.showtimes[0] as any);
    const kgfShow = (kgf2.showtimes[2] as any);
    const failShow = (fail12.showtimes[1] as any);

    const sampleBookings = [
      // Booking Today: RRR in IMAX Laser
      {
        bookingId: 'CNP-IND-892145',
        user: customer1._id,
        userEmail: customer1.email,
        userName: customer1.name,
        movie: rrr._id,
        movieTitle: rrr.title,
        moviePoster: rrr.posterUrl,
        showtimeId: rrrShow1._id?.toString() || 'st-rrr-1',
        showDate: rrrShow1.date,
        showTime: rrrShow1.time,
        screen: rrrShow1.screen,
        seats: ['D4', 'D5'],
        totalAmount: rrrShow1.price * 2,
        paymentStatus: 'completed',
        paymentMethod: 'UPI / Instant QR',
        createdAt: todayDate,
      },
      // Booking Today: Jawan in Dolby Atmos
      {
        bookingId: 'CNP-IND-773192',
        user: customer2._id,
        userEmail: customer2.email,
        userName: customer2.name,
        movie: jawan._id,
        movieTitle: jawan.title,
        moviePoster: jawan.posterUrl,
        showtimeId: jawanShow._id?.toString() || 'st-jawan-1',
        showDate: jawanShow.date,
        showTime: jawanShow.time,
        screen: jawanShow.screen,
        seats: ['E6', 'E7', 'E8'],
        totalAmount: jawanShow.price * 3,
        paymentStatus: 'completed',
        paymentMethod: 'Google Pay (UPI)',
        createdAt: todayDate,
      },
      // Booking Yesterday: Kalki 2898 AD in VIP Recliner
      {
        bookingId: 'CNP-IND-431872',
        user: customer3._id,
        userEmail: customer3.email,
        userName: customer3.name,
        movie: kalki._id,
        movieTitle: kalki.title,
        moviePoster: kalki.posterUrl,
        showtimeId: kalkiShow._id?.toString() || 'st-kalki-1',
        showDate: kalkiShow.date,
        showTime: kalkiShow.time,
        screen: kalkiShow.screen,
        seats: ['B2', 'B3'],
        totalAmount: kalkiShow.price * 2,
        paymentStatus: 'completed',
        paymentMethod: 'PhonePe UPI',
        createdAt: yesterdayDate,
      },
      // Booking Yesterday: Stree 2 in IMAX Laser
      {
        bookingId: 'CNP-IND-619204',
        user: customer4._id,
        userEmail: customer4.email,
        userName: customer4.name,
        movie: stree2._id,
        movieTitle: stree2.title,
        moviePoster: stree2.posterUrl,
        showtimeId: streeShow._id?.toString() || 'st-stree-1',
        showDate: streeShow.date,
        showTime: streeShow.time,
        screen: streeShow.screen,
        seats: ['F1', 'F2', 'F3', 'F4'],
        totalAmount: streeShow.price * 4,
        paymentStatus: 'completed',
        paymentMethod: 'Paytm UPI',
        createdAt: yesterdayDate,
      },
      // Booking Yesterday: RRR Evening Show
      {
        bookingId: 'CNP-IND-528245',
        user: customer5._id,
        userEmail: customer5.email,
        userName: customer5.name,
        movie: rrr._id,
        movieTitle: rrr.title,
        moviePoster: rrr.posterUrl,
        showtimeId: rrrShow2._id?.toString() || 'st-rrr-2',
        showDate: rrrShow2.date,
        showTime: rrrShow2.time,
        screen: rrrShow2.screen,
        seats: ['C3', 'C4'],
        totalAmount: rrrShow2.price * 2,
        paymentStatus: 'completed',
        paymentMethod: 'Net Banking (HDFC Bank)',
        createdAt: yesterdayDate,
      },
      // Booking 3 Days Ago: KGF Chapter 2
      {
        bookingId: 'CNP-IND-319082',
        user: customer6._id,
        userEmail: customer6.email,
        userName: customer6.name,
        movie: kgf2._id,
        movieTitle: kgf2.title,
        moviePoster: kgf2.posterUrl,
        showtimeId: kgfShow._id?.toString() || 'st-kgf-1',
        showDate: kgfShow.date,
        showTime: kgfShow.time,
        screen: kgfShow.screen,
        seats: ['D7', 'D8', 'D9'],
        totalAmount: kgfShow.price * 3,
        paymentStatus: 'completed',
        paymentMethod: 'Net Banking (ICICI Bank)',
        createdAt: threeDaysAgoDate,
      },
      // Booking 3 Days Ago: 12th Fail
      {
        bookingId: 'CNP-IND-194821',
        user: customer7._id,
        userEmail: customer7.email,
        userName: customer7.name,
        movie: fail12._id,
        movieTitle: fail12.title,
        moviePoster: fail12.posterUrl,
        showtimeId: failShow._id?.toString() || 'st-fail-1',
        showDate: failShow.date,
        showTime: failShow.time,
        screen: failShow.screen,
        seats: ['E1', 'E2'],
        totalAmount: failShow.price * 2,
        paymentStatus: 'completed',
        paymentMethod: 'UPI / Instant QR',
        createdAt: threeDaysAgoDate,
      },
    ];

    await Booking.insertMany(sampleBookings);
    console.log(`✅ Seeded ${sampleBookings.length} initial box-office bookings for Indian movies.`);

    console.log('🎉 Indian Cinema Database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Database seeding error:', err);
  } finally {
    if (disconnectAfter) {
      await disconnectDB();
    }
  }
};

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true).then(() => process.exit(0));
}
