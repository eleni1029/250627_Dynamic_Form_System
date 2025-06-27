import session from 'express-session';

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // 30 天
  },
  name: 'dynamic_form_session',
};
