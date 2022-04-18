const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

const config = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
}

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
}

function verifyCallback(accesstoken, refreshToken, profile, done) {
  console.log('Google Profile', profile);
  done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

const api = require('./routes/api')

const app = express();

// Helmet for node security
// app.use(helmet());

app.use(passport.initialize());

function checkLoggedIn(req, res, next) {
  const isLoggedIn = true;
  if (!isLoggedIn) {
    return res.status(401).json({
      message: 'Unauthorized'
    });
  }

  next();
}

app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(morgan('combined'));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route version 1
app.use('/v1', api);

// Social Authentication
app.get('/auth/google',
  passport.authenticate('google',{
      scope: ['email'],
    }));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/dashboard',
    session: false,
  }), (req, res) => {
    console.log('Google called us back!')
  }
);

app.get('/failure', (req, res) => {
  return res.send('Failed to login');
});

app.get('/auth/logout', (req, res) => {
  return res.send('Secret stuff');
});

// Test Authentication Route
app.get('/secret', checkLoggedIn, (_req, res) => {
  return res.send('Secret stuff');
});

// Builded frontend app
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
})

app.get('/*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
})

module.exports = app;