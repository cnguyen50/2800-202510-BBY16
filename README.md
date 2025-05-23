# 🌐 **commUnity**

### Project by **Team BBY-16**
- Taylor Hillier
- Calvin Nguyen
- Veronica Sheng
- Leen Seydoun
- Tom Padilla

---

## 📖 **Project Description**

**commUnity** is a neighborhood-focused social media app empowering residents to connect through localized posts, community-driven events, and personalized recommendations from an integrated AI assistant.

---

## 🚀 **Features**

- **Post Creation**
  - Create Polls, General Posts, or Community News
- **Feeds**
  - Personalized main feed (`/home`)
  - Neighborhood-specific feed (`/mycommunity`)
  - Trending polls (`/trendingPolls`)
  - Filter posts by type
- **Interactive Map**
  - View neighborhood events with detailed info (`/map`)
- **Profiles**
  - View and manage your profile (`/profile`)
  - View other users' profiles (`/user/:id`)
- **Notifications**
  - Receive comment alerts and poll reminders (`/notifications`)
- **AI Assistant**
  - Suggests local activities and events based on your location
- **Community Interaction**
  - Like posts and comments
  - Comment on posts

---

## 💻 **Technologies**

**Frontend:**
- HTML5, CSS3, JavaScript
- Bootstrap 5
- EJS Templates
- Chart.js
- Leaflet.js with MarkerCluster
- Geolocation API

**Backend:**
- Node.js, Express.js

**Database:**
- MongoDB Atlas, Mongoose ODM

**Authentication & Session:**
- express-session
- connect-mongo
- Bcrypt (password hashing)
- Joi (validation)

**Deployment:**
- Render

**Other Tools:**
- SweetAlert (alerts)
- Socket.io (real-time updates)
- Node-Cron (scheduled tasks)
- Nominatim API (location data)
- Multer (image upload)

Deepseek was used for our ai capabilites (ai.js, ai.route.js, main.ejs). The ai.route.js endpoint recieves a request from the form on main.ejs/ai.js, this sends a simple prompt
requesting 3 to 7 things to do in the users current location.

The users current location is found using navigator. Navigator asks to use their location and grabs the users current coordinates. This feature is used in tandem
with Nominatim and Leaflet to display our map on (`/map`).
---

## ⚙️ **Installation**

All dependencies can be installed on the root.

Before. **Setup MongoDB**

Create a mongoDB atlas account and create a database.

Before. **Setup DeepSeek**

Create a deepSeekAPI account and deposit funds. Retrieve API key.

1. **Clone the repository**
```bash
git clone https://github.com/cnguyen50/2800-202510-BBY16.git
cd 2800-202510-BBY16
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file at the project root:
```
MONGODB_URI=Your uri
PORT=Your Port
SESSION_SECRET=Your secret
DB_NAME=Your db name
DEEPSEEK_KEY=Your deepseek key
```

4. **Seed the database** *(optional)*
note: All seed.js files in this repo are not updated and may not populate data correctly, once everything is installed and you run the site - you should be able to create data by using the ui easily.
```bash
npm run seed
```


5. **Start the application**
If not already there, add 
```bash
"start": "node -r dotenv/config server.js"
```
to your package.json.
```bash
npm start
```

---

## 📂 **File Structure**

```
.
├── root/
│   ├── middleware/
│   │   ├── requireAuth.js         # Middleware for user authentication
│   │   ├── validate.js            # Data validation middleware
│   │   └── validateuser.js        # User-specific validation middleware
│   ├── models/                    # Database schemas
│   │   ├── comment.model.js
│   │   ├── notification.model.js
│   │   ├── post.model.js
│   │   └── user.model.js
│   ├── public/
│   │   ├── fonts
│   │   ├── img
│   │   ├── scripts/               # Client-side JavaScript files
│   │   │   ├── ai.js
│   │   │   ├── comment.js
│   │   │   ├── geoLocate.js
│   │   │   ├── loadHeaderFooter.js
│   │   │   ├── login.js
│   │   │   ├── main.js
│   │   │   ├── map.js
│   │   │   ├── myCommunity.js
│   │   │   ├── nav.js
│   │   │   ├── notifications.js
│   │   │   ├── pollChart.js
│   │   │   ├── post.js
│   │   │   ├── profile.js
│   │   │   └── renderSvgs.js
│   │   ├── styles/                # CSS for styling
│   │   │   ├── 404.css
│   │   │   ├── ai.css
│   │   │   ├── footer.css
│   │   │   ├── index.css
│   │   │   ├── loggedIn.css
│   │   │   ├── login.css
│   │   │   ├── main.css
│   │   │   ├── map.css
│   │   │   ├── modal.css
│   │   │   ├── nav.css
│   │   │   ├── notifications.css
│   │   │   ├── polls.css
│   │   │   ├── profile.css
│   │   │   ├── styles.css
│   │   │   └── trendingPoll.css
│   │   ├── login.html
│   │   └── map.html
│   ├── routes/                    # API Routes
│   │   ├── ai.route.js
│   │   ├── auth.route.js
│   │   ├── comments.route.js
│   │   ├── events.route.js
│   │   ├── map-data.route.js
│   │   ├── notifications.api.js
│   │   ├── polls.route.js
│   │   ├── posts.route.js
│   │   ├── postTypes.route.js
│   │   └── users.route.js
│   ├── scripts/                   # Database seed and helper scripts
│   │   ├── db.js
│   │   ├── randomSvgs.js
│   │   ├── reminders.js
│   │   ├── seed.js
│   │   ├── seedComments.js
│   │   ├── seedNeighbourhood.js
│   │   ├── seedNews.js
│   │   ├── seedPosts.js
│   │   └── seedPostTypes.js
│   └── views/                     # View templates (EJS)
│       ├── partials/
│       │   └── postModal.ejs
│       ├── templates/
│       │   ├── loggedFooter.ejs
│       │   └── loggedHeader.ejs
│       ├── 404.ejs
│       ├── main.ejs
│       ├── map.ejs
│       ├── myCommunity.ejs
│       ├── notifications.ejs
│       ├── poll.ejs
│       └── trendingPoll.ejs
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js                      # Entry point of the application
```

---

## 🙌 **Credits**

- [Bootstrap 5](https://getbootstrap.com)
- [Leaflet.js](https://leafletjs.com)
- [Chart.js](https://www.chartjs.org)
- [SweetAlert](https://sweetalert.js.org)
- [Socket.io](https://socket.io)
- [Multer](https://github.com/expressjs/multer)
- [Nominatim API](https://nominatim.org)
- [Render](https://render.com)
- Stack Overflow (general coding assistance and inspiration)

---

## 📃 **License**

This project is intended for educational purposes only and does not currently include a commercial license.
