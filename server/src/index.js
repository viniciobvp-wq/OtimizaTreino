import 'dotenv/config';
import { criarApp } from './app.js';

const PORT = Number(process.env.PORT || 3001);

criarApp().listen(PORT, () => {
  console.log(`OtimizaTreino API rodando em http://localhost:${PORT}`);
});
