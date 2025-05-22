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
    // connectDB() returns { db, client }
    const { db, client } = await connectDB();

    const app = express();

    // app.use(middleware) attaches JSON-body parser to all requests
    // handles application/json
    app.use(express.json());

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // app.use(middleware) attaches URL-encoded parser
    // handles form submissions from HTML <form>
    app.use(express.urlencoded({ extended: true }));

    // app.use(express.static(dir)) serves static files
    // exposes everything inside /public
    app.use(express.static('public'));

    // app.use(session(options)) adds req.session support
    // stores sessions in MongoDB, 14-day cookie
    const sessionMiddleware =
      session({
        name: 'sessionId',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoDBStore.create({
          client,
          dbName: process.env.DB_NAME,
          collectionName: 'sessions',
          ttl: 14 * 24 * 60 * 60
        }),
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          // secure: process.env.NODE_ENV === 'production',
          maxAge: 14 * 24 * 60 * 60 * 1000
        }
      });

    app.use(sessionMiddleware);

    const http = require('http').createServer(app);
    const { Server } = require('socket.io');

    const io = new Server(http, { cors: { origin: '*' } });
    app.io = io;

    require('./scripts/reminders.js')(io);

    io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    })

    io.on('connection', (socket) => {
      const uid = socket.request.session.userId;
      if (uid) {
        socket.join(String(uid));
      } else {
      }
    })

    // app.use('/auth', router) mounts router under /auth
    // routes for login, register, logout, etc.
    app.use('/auth', makeAuthRouter());

    // app.use('/users', router) mounts router under /users
    // profile, update, delete, current user endpoints
    app.use('/users', requireAuth, makeUsersRouter());

    app.get('/map', requireAuth, async (req, res) => {
      try {
        const today = new Date();
        const nextWeek = new Date();

        nextWeek.setDate(today.getDate() + 7);

        const events = await EventPost
          .find({ event_date: { $gte: today, $lte: nextWeek } })
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

    // JSON API: events in my neighbourhood for map pins
    app.use('/map/data', requireAuth, makeMapDataRouter());

    // app.use('/posts', router) mounts router under /posts
    // create, read, update, delete posts
    app.use('/posts', requireAuth, makePostsRouter());

    // app.use('/comments', router) mounts router under /comments
    // create and list current user comments
    app.use('/comments', requireAuth, makeCommentsRouter());

    // app.use('/events', router) mounts router under /events
    // create, read, update, delete typed posts
    //app.use('/events', makeTypedRouter(EventPost));
    // Useing this since seperated event.route.js
    app.use('/events', requireAuth, makeEventsRouter());

    app.use('/news', requireAuth, makeTypedRouter(NewsPost));

    app.get('/notifications', requireAuth, (req, res) => {
      const svgDir = path.join(__dirname, './public/img/svg/');
      fs.readdir(svgDir, (err, files) => {
        if (err) return res.status(500).send("Failed to load SVGs");
        const svgs = files.filter(file => file.endsWith('.svg'));
        const shuffled = svgs.sort(() => 0.5 - Math.random());
        const count = Math.floor(Math.random() * 6) + 5; // 5 to 10
        const selectedSvgs = shuffled.slice(0, count);
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
    });

    const pollsRouter = require('./routes/polls.route.js');
    app.use('/polls', requireAuth, pollsRouter);

    app.get('/trendingpoll', requireAuth, async (req, res) => {
      if (!req.session.userId) return res.redirect('/login');

      const topPolls = await PollPost.find().lean();

      const sorted = topPolls
        .map(p => ({
          ...p,
          totalVotes: p.options.reduce((sum, o) => sum + o.votes, 0)
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 6); // show 6 trending

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
          svgs: selectedSvgs // ✅ pass SVGs to your EJS
        });
    
    });


    // Serve uploaded profile pictures
    app.use('/uploads', requireAuth, express.static(path.join(__dirname, 'public/uploads')));

    app.use('/api/notifications', requireAuth, require('./routes/notifications.api.js'));

    // app.get(path, handler) sends index page
    // landing page
    app.get('/', (req, res) => {
      console.log(req.session.userId);
      if (req.session.userId) {
        res.redirect('/home');
      } else {
        res.sendFile(path.join(__dirname, './public/login.html'))
      }
    });

    app.use('/ai', requireAuth, aiRouter);

    //app.get(path, handler) sends profile page
    //profile page (uses JS to fetch /current endpoints)
    app.get('/profile', requireAuth, async (req, res) => {
      if (!req.session.userId) {
        return res.redirect('/login');  // If user is not logged in, redirect to login
      }

      try {
        const user = await User.findById(req.session.userId);  // Fetch user from DB
        if (!user) {
          return res.status(404).send('User not found');  // If user is not found in DB
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

    // app.get(path, handler) sends main feed
    // main/home page
    app.get('/home', requireAuth, async (req, res) => {
      if (!req.session.userId) {
        res.redirect('/login');
      }
      else {
          const selectedSvgs = await getRandomSvgs(svgPath);

          res.render('main', {
            title: 'Home',
            headerLinks: [
              { rel: 'stylesheet', href: '/styles/main.css' },
              { rel: 'stylesheet', href: '/styles/loggedIn.css' },
              { rel: 'stylesheet', href: '/styles/polls.css' },
              { rel: 'stylesheet', href: '/styles/ai.css' },
              { rel: 'stylesheet', href: '/styles/modal.css' },

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

    app.use('/myCommunity', requireAuth, async (req, res) => {


        const selectedSvgs = await getRandomSvgs(svgPath);
        res.render('myCommunity', {
          title: 'My Community',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/loggedIn.css' },
            { rel: 'stylesheet', href: '/styles/main.css' },
          ],
          footerScripts: [
            { src: '/scripts/myCommunity.js' },
            { src: '/scripts/comment.js' },
            { src: '/scripts/post.js' }
          ],
          svgs: selectedSvgs
        });


    });

    // app.use(path, handler) intercepts /login
    // redirects logged-in users, otherwise shows login form
    app.use('/login', (req, res) => {
      if (req.session.userId) {
        res.redirect('/home');
      } else {
        res.sendFile(path.join(__dirname, './public/login.html'));
      }
    });


    // Start HTTP server on given port
    // default 3000
    const PORT = process.env.PORT || 3000;

    http.listen(PORT, () => {
    });

  } catch (error) {
    // Print DB connection errors and exit
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
})();
