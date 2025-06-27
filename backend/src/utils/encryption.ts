// backend/src/utils/encryption.ts - 完整版本
import bcrypt from 'bcryptjs';

export class EncryptionUtil {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

  // 密碼加密
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  // 密碼驗證
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }

  // 生成隨機密碼
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // 生成測試用戶的密碼 hash（開發用）
  static async generateTestPasswords(): Promise<{[key: string]: string}> {
    return {
      'password123': await this.hashPassword('password123'),
      'admin123': await this.hashPassword('admin123'),
      'user123': await this.hashPassword('user123'),
      'demo123': await this.hashPassword('demo123'),
    };
  }
}

// 如果直接執行此文件，生成測試密碼
if (require.main === module) {
  EncryptionUtil.generateTestPasswords().then(hashes => {
    console.log('Test password hashes:');
    Object.entries(hashes).forEach(([password, hash]) => {
      console.log(`${password}: ${hash}`);
    });
  });
}