// backend/src/config/session.ts - 修復版本
import session from 'express-session';
import { getPoolSafe } from './database';

// 簡化的 Session 配置（不依賴 connect-pg-simple）
export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次請求都重新設置過期時間
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
    httpOnly: true, // 防止 XSS 攻擊
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // 30 天
    sameSite: 'strict', // CSRF 保護
  },
  name: 'dynamic_form_session', // 自定義 session 名稱
};

// 如果需要 PostgreSQL session store，可以稍後添加
// export const createSessionStore = () => {
//   const pool = getPoolSafe();
//   if (pool) {
//     const PgSession = connectPgSimple(session);
//     return new PgSession({
//       pool: () => pool,
//       tableName: 'session',
//       createTableIfMissing: false,
//     });
//   }
//   return undefined;
// };