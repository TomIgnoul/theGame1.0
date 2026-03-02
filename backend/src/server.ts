import 'dotenv/config';
import app from './app';
import { loadEnv } from './config/env';

const { PORT } = loadEnv();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
