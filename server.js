// Load .env into process.env
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const User = require('./models/user.model.js');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./scripts/db.js');
const makeAuthRouter = require('./routes/auth.route.js');
const makeUsersRouter = require('./routes/users.route.js');
const makePostsRouter = require('./routes/posts.route.js');
const makeTypedRouter = require('./routes/postTypes.route.js');
const makeCommentsRouter = require('./routes/comments.route.js');
const aiRouter = require('./routes/ai.route.js');
const makeEventsRouter = require('./routes/events.route.js');
const makeMapDataRouter = require('./routes/map-data.route.js');

const getRandomSvgs = require('./scripts/randomSvgs.js');
const svgPath = path.join(__dirname, './public/img/svg');

const { EventPost, PollPost, NewsPost } = require('./models/post.model.js');
const requireAuth = require('./middleware/requireAuth.js');

(async () => {
  try {
    // Connect to MongoDB and get both db and client for session storage
    const { db, client } = await connectDB();

    const app = express();

    // Parse JSON request bodies
    app.use(express.json());

    // Set up EJS as the template engine and set views directory
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // Parse URL-encoded request bodies (form submissions)
    app.use(express.urlencoded({ extended: true }));

    // Serve static files from the /public directory
    app.use(express.static('public'));

    // Set up session middleware, using MongoDB as the session store
    const sessionMiddleware = session({
      name: 'sessionId',
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoDBStore.create({
        client,
        dbName: process.env.DB_NAME,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        // secure: process.env.NODE_ENV === 'production',
        maxAge: 14 * 24 * 60 * 60 * 1000
      }
    });

    app.use(sessionMiddleware);

    // Set up HTTP server and Socket.io for real-time features (e.g., notifications)
    const http = require('http').createServer(app);
    const { Server } = require('socket.io');
    const io = new Server(http, { cors: { origin: '*' } });
    app.io = io;

    // Initialize reminders system to use sockets for scheduled notifications
    require('./scripts/reminders.js')(io);

    // Allow Socket.io to use session data
    io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    });

    // On socket connection, join a user-specific room if logged in
    io.on('connection', (socket) => {
      const uid = socket.request.session.userId;
      if (uid) {
        socket.join(String(uid));
      }
    });

    // Public routes (authentication)
    app.use('/auth', makeAuthRouter());

    // Authenticated routes (require logged-in user)
    app.use('/users', requireAuth, makeUsersRouter());
    app.use('/posts', requireAuth, makePostsRouter());
    app.use('/comments', requireAuth, makeCommentsRouter());
    app.use('/events', requireAuth, makeEventsRouter());
    app.use('/news', requireAuth, makeTypedRouter(NewsPost));
    app.use('/map/data', requireAuth, makeMapDataRouter());
    app.use('/polls', requireAuth, require('./routes/polls.route.js'));
    app.use('/api/notifications', requireAuth, require('./routes/notifications.api.js'));
    app.use('/ai', requireAuth, aiRouter);

    // Serve uploaded profile pictures from /public/uploads
    app.use('/uploads', requireAuth, express.static(path.join(__dirname, 'public/uploads')));

    // MAP PAGE: render map and event markers
    app.get('/map', requireAuth, async (req, res) => {
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const events = await EventPost
          .find()
          .sort({ event_date: 1 })
          .populate('user_id', 'username')
          .lean();

        const selectedSvgs = await getRandomSvgs(svgPath);

        res.render('map', {
          title: 'Map',
          headerLinks: [
            { rel: 'stylesheet', href: 'https://unpkg.com/leaflet/dist/leaflet.css' },
            { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css' },
            { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css' },
            { rel: 'stylesheet', href: '/styles/map.css' },
            { rel: 'stylesheet', href: '/styles/loggedIn.css' }
          ],
          footerScripts: [
            { src: 'https://unpkg.com/leaflet/dist/leaflet.js' },
            { src: 'https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js' },
            { src: '/scripts/map.js' }
          ],
          events,
          selectedSvgs
        });
      } catch (err) {
        console.log("Cannot fetch map and events", err);
      }
    });

    // NOTIFICATIONS PAGE: render notifications UI for user
    app.get('/notifications', requireAuth, async (req, res) => {
      const selectedSvgs = await getRandomSvgs(svgPath);

      res.render('notifications', {
        userId: req.session.userId,
        headerLinks: [
          { rel: 'stylesheet', href: '/styles/loggedIn.css' },
          { rel: 'stylesheet', href: '/styles/notifications.css' }
        ],
        footerScripts: [
          { src: '/scripts/notifications.js' }
        ],
        svgs: selectedSvgs
      });
    });

    // TRENDING POLLS PAGE: show top polls sorted by votes
    app.get('/trendingpoll', requireAuth, async (req, res) => {
      if (!req.session.userId) return res.redirect('/login');

      const topPolls = await PollPost.find().lean();

      const sorted = topPolls
        .map(p => ({
          ...p,
          totalVotes: p.options.reduce((sum, o) => sum + o.votes, 0)
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 6); // show top 6

      const selectedSvgs = await getRandomSvgs(svgPath);

      res.render('trendingpoll', {
        title: 'Trending Polls',
        polls: sorted,
        headerLinks: [
          { rel: 'stylesheet', href: '/styles/loggedIn.css' },
          { rel: 'stylesheet', href: '/styles/polls.css' },
          { rel: 'stylesheet', href: '/styles/trendingPoll.css' }
        ],
        footerScripts: [
          { src: 'https://cdn.jsdelivr.net/npm/chart.js' },
          { src: '/scripts/pollChart.js' }
        ],
        svgs: selectedSvgs
      });
    });

    // LANDING PAGE: redirect logged-in users, show login for guests
    app.get('/', (req, res) => {
      if (req.session.userId) {
        res.redirect('/home');
      } else {
        res.sendFile(path.join(__dirname, './public/login.html'));
      }
    });

    // PROFILE PAGE: view/update your profile
    app.get('/profile', requireAuth, async (req, res) => {
      if (!req.session.userId) {
        return res.redirect('/login');
      }
      try {
        const user = await User.findById(req.session.userId);
        if (!user) {
          return res.status(404).send('User not found');
        }
        const selectedSvgs = await getRandomSvgs(svgPath);
        res.render('profile', {
          title: 'Profile',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/loggedIn.css' },
            { rel: 'stylesheet', href: '/styles/polls.css' },
            { rel: 'stylesheet', href: '/styles/profile.css' }
          ],
          footerScripts: [
            { src: '/scripts/profile.js', type: 'module' },
            { src: '/scripts/comment.js' },
            { src: '/scripts/pollChart.js' }
          ],
          user,
          svgs: selectedSvgs,
          viewingOtherUser: false
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });

    // MAIN FEED PAGE: home feed for logged-in users
    app.get('/home', async (req, res) => {
      if (!req.session.userId) {
        res.redirect('/login');
      } else {
        const selectedSvgs = await getRandomSvgs(svgPath);

        res.render('main', {
          title: 'CommUnity Feed',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/main.css' },
            { rel: 'stylesheet', href: '/styles/loggedIn.css' },
            { rel: 'stylesheet', href: '/styles/polls.css' },
            { rel: 'stylesheet', href: '/styles/ai.css' },
            { rel: 'stylesheet', href: '/styles/modal.css' }
          ],
          footerScripts: [
            { src: '/scripts/main.js' },
            { src: '/scripts/comment.js' },
            { src: '/scripts/pollChart.js' },
            { src: '/scripts/ai.js' },
            { src: '/scripts/post.js' }
          ],
          svgs: selectedSvgs
        });
      }
    });

    // NEIGHBOURHOOD FEED PAGE: posts and events in your area
    app.use('/myCommunity', requireAuth, async (req, res) => {
      const selectedSvgs = await getRandomSvgs(svgPath);
      res.render('myCommunity', {
        title: 'My Community',
        headerLinks: [
          { rel: 'stylesheet', href: '/styles/loggedIn.css' },
          { rel: 'stylesheet', href: '/styles/main.css' }
        ],
        footerScripts: [
          { src: '/scripts/myCommunity.js' },
          { src: '/scripts/comment.js' },
          { src: '/scripts/post.js' }
        ],
        svgs: selectedSvgs
      });
    });

    // LOGIN PAGE: redirect to home if already logged in
    app.use('/login', (req, res) => {
      if (req.session.userId) {
        res.redirect('/home');
      } else {
        res.sendFile(path.join(__dirname, './public/login.html'));
      }
    });

    // 404 HANDLER: custom not found page for logged-in users
    app.use(async (req, res, next) => {
      if (!req.session.userId) {
        res.redirect('/login');
      } else {
        const selectedSvgs = await getRandomSvgs(svgPath);
        res.status(404).render('404', {
          title: '404 Not Found',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/main.css' },
            { rel: 'stylesheet', href: '/styles/404.css' }
          ],
          footerScripts: [
            { src: '/scripts/renderSvgs.js' }
          ],
          svgs: selectedSvgs
        });
      }
    });

    // Start the HTTP server on configured port (default: 3000)
    const PORT = process.env.PORT || 3000;
    http.listen(PORT, () => {
      // Server started
    });

  } catch (error) {
    // Print DB connection errors and exit
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
})();
