const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'dominic',
  host: 'localhost',
  database: 'dynamic_form_system',
  password: '',
  port: 5432,
});

async function testAuth() {
  try {
    // 查詢用戶
    const result = await pool.query(
      'SELECT id, username, password_hash, name, is_active FROM users WHERE username = $1 AND is_active = true',
      ['testuser']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('👤 Found user:', user.username, user.name);
    
    // 驗證密碼
    const isValid = await bcrypt.compare('password123', user.password_hash);
    console.log('🔐 Password valid:', isValid);
    
    if (isValid) {
      console.log('✅ Authentication should work!');
    } else {
      console.log('❌ Password verification failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testAuth();
