const { execSync } = require('child_process');

const dbUrl =
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' ? process.env.DATABASE_URL : null) ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.STORAGE_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.STORAGE_POSTGRES_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log('Database URL resolved successfully.');
} else {
  console.warn('Warning: DATABASE_URL not found in environment!');
}

try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  execSync('npx next build', { stdio: 'inherit', env: process.env });
} catch (err) {
  process.exit(1);
}
