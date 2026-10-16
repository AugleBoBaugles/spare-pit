import app from './app.js';
import { initDb, DB_CLIENT } from './db/index.js';

const PORT = process.env.PORT || 3000;

console.log(`Using database: ${DB_CLIENT}`);

try {
  await initDb();
} catch (err) {
  console.error('Server startup failed:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
