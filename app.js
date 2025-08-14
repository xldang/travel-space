const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

const { sequelize } = require('./models');
const travelRoutes = require('./routes/travels');
const itineraryRoutes = require('./routes/itineraries');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'travel-blog-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
    } : null;
    next();
});

app.use('/', travelRoutes);
app.use('/itineraries', itineraryRoutes);
app.use('/', authRoutes);

app.get('/', (req, res) => {
    res.redirect('/travels');
});

sequelize.sync({ alter: false }).then(() => {
    console.log('Database synced');
    // Only listen when not in a serverless environment like Vercel
    if (!process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access the blog at http://localhost:${PORT}`);
        });
    }
}).catch(err => {
    console.error('Unable to sync database:', err);
    // Fallback for local dev
    if (!process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (with sync error)`);
        });
    }
});

module.exports = app;