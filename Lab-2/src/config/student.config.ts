import { ConfigModule } from '@nestjs/config';

export interface StudentConfig {
  lastName: string;
  initials: string;
  group: string;
  variant: number;
  jwtSecret: string;
  getExpiresInSeconds(): number;
  getExpiresInFormatted(): string;
}

export const getStudentConfig = (): StudentConfig => {
  const variant = Number(process.env.STUDENT_VARIANT ?? 1);
  const expiresInSeconds = 60 + variant;

  return {
    lastName: process.env.STUDENT_LAST_NAME ?? 'Вівдиченко',
    initials: process.env.STUDENT_INITIALS ?? 'М. С.',
    group: process.env.STUDENT_GROUP ?? 'ІП-34',
    variant: 9,
    jwtSecret: process.env.JWT_SECRET ?? 'lab2_jwt_super_secret_key_2026',
    getExpiresInSeconds: () => expiresInSeconds,
    getExpiresInFormatted: () => `${expiresInSeconds}s`,
  };
};

export const studentConfig = getStudentConfig();
