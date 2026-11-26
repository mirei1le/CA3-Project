const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const seedDatabase = require('./seed');
const User = require('./models/User');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/student_portal';
const SESSION_SECRET = process.env.SESSION_SECRET || 'student-portal-secret';

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions (stored in MongoDB so they survive a restart)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
  })
);

// Make the logged-in user, flash messages and helpers available in every view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  res.locals.formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formats a date for <input type="datetime-local">
  res.locals.toInputDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    );
  };
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/profile', require('./routes/profile'));
app.use('/modules', require('./routes/modules'));
app.use('/announcements', require('./routes/announcements'));
app.use('/assignments', require('./routes/assignments'));
app.use('/submissions', require('./routes/submissions'));
app.use('/grades', require('./routes/grades'));
app.use('/admin', require('./routes/admin'));

// 404 page
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    message: 'The page you are looking for does not exist.',
  });
});

async function start() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  // First run: fill the database with demo data
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Database is empty - adding demo data');
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`Student Portal running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start the server:', err);
  process.exit(1);
});
