import session from 'express-session';

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false, // 開發環境設為 false
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // 30 天
    sameSite: 'lax', // 改為 lax，允許跨站請求
  },
  name: 'dynamic_form_session',
};
