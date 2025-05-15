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
const makePollsRouter = require('./routes/polls.route.js');
const makeTypedRouter = require('./routes/postTypes.route.js');
const makeCommentsRouter = require('./routes/comments.route.js');
const makeNewsRouter = require('./routes/news.route.js');

const { EventPost, PollPost, NewsPost } = require('./models/post.model.js');

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
    const {Server} = require('socket.io');

    const io = new Server(http, { cors: {origin: '*'} });
    app.io = io;

    require('./scripts/reminders.js')(io);  
    
    io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    })

    io.on('connection', (socket) => {
      const uid = socket.request.session.userId;
      if(uid) {
        socket.join(String(uid));
        console.log('[socket-join]', uid);
      } else {
        console.log('[socket-join]', 'anonymous');
      }
    })

    // app.use('/auth', router) mounts router under /auth
    // routes for login, register, logout, etc.
    app.use('/auth', makeAuthRouter());

    // app.use('/users', router) mounts router under /users
    // profile, update, delete, current user endpoints
    app.use('/users', makeUsersRouter());

    app.get('/map', (req, res) => {
      res.render('map', {
        title: 'Map',
        headerLinks: [
          { rel: 'stylesheet', href: 'https://unpkg.com/leaflet/dist/leaflet.css' },
          { rel: 'stylesheet', href: '/styles/map.css' },
          { rel: 'stylesheet', href: '/styles/loggedIn.css' }
        ],
        footerScripts: [
          { src: 'https://unpkg.com/leaflet/dist/leaflet.js' },
          { src: '/scripts/map.js' }
        ]
      });
    });

    // app.use('/posts', router) mounts router under /posts
    // create, read, update, delete posts
    app.use('/posts', makePostsRouter());

    // app.use('/comments', router) mounts router under /comments
    // create and list current user comments
    app.use('/comments', makeCommentsRouter());

    // app.use('/events', router) mounts router under /events
    // create, read, update, delete typed posts
    app.use('/events', makeTypedRouter(EventPost));
    app.use('/news', makeTypedRouter(NewsPost));

    app.get('/notifications', (req, res) => {
      res.render('notifications', {
        userId: req.session.userId,
         headerLinks: [
          { rel: 'stylesheet', href: '/styles/loggedIn.css' },
          { rel: 'stylesheet', href: '/styles/notifications.css' }
        ],
        footerScripts: [
          { src: '/scripts/notifications.js' }
        ]
      });
    });


    const pollsRouter = require('./routes/polls.route.js');
    app.use('/polls', pollsRouter);


    // Serve uploaded profile pictures
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    app.use('/api/notifications', require('./routes/notifications.api.js'));

    // app.get(path, handler) sends index page
    // landing page
    app.get('/', (req, res) =>{
      if(req.session.userId) {
        res.redirect('/home');
      } else {
      res.sendFile(path.join(__dirname, './public/index.html'))
      }
    });

    //app.get(path, handler) sends profile page
    //profile page (uses JS to fetch /current endpoints)
    app.get('/profile', async (req, res) => {
      if (!req.session.userId) {
        return res.redirect('/login');  // If user is not logged in, redirect to login
      }

      try {
        const user = await User.findById(req.session.userId);  // Fetch user from DB
        if (!user) {
          return res.status(404).send('User not found');  // If user is not found in DB
        }

        res.render('profile', {
          title: 'Profile',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/loggedIn.css' },
            { rel: 'stylesheet', href: '/styles/profile.css' }
          ],
          footerScripts: [
            { src: '/scripts/profile.js' },
          ],
          user,  // Pass the user object to the EJS template
        });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });

    // app.get(path, handler) sends main feed
    // main/home page
    app.get('/home', (req, res) => {
      if (!req.session.userId) {
        res.redirect('/login');
      }
      else {
        // Render the main page with the logged-in user
        // Display random SVGs
        const svgDir = path.join(__dirname, './public/img/svg/');
        fs.readdir(svgDir, (err, files) => {
          if (err) return res.status(500).send("Failed to load SVGs");

          // Filter only .svg files
          const svgs = files.filter(file => file.endsWith('.svg'));

          // Shuffle and pick 5–10 SVGs
          const shuffled = svgs.sort(() => 0.5 - Math.random());
          const count = Math.floor(Math.random() * 6) + 5; // 5 to 10
          const selectedSvgs = shuffled.slice(0, count);

          res.render('main', {
            title: 'Home',
            headerLinks: [
              { rel: 'stylesheet', href: '/styles/main.css' },
              { rel: 'stylesheet', href: '/styles/loggedIn.css' },

            ],
            footerScripts: [
              { src: '/scripts/main.js' },
              { src: '/scripts/comment.js' }
            ],
            svgs: selectedSvgs
          });
      }
    )}
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

    app.use('/logout', (req, res) => {
      if (!req.session.userId) {
        res.redirect('/login');
      } else {
        res.render('logout', {
          title: 'Logout',
          headerLinks: [
            { rel: 'stylesheet', href: '/styles/loggedIn.css' }
          ],
          footerScripts: [

          ]
        })
      }
    })

    // Start HTTP server on given port
    // default 3000
    const PORT = process.env.PORT || 3000;

    http.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    // Print DB connection errors and exit
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
})();
