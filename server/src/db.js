import 'dotenv/config';
import mysql from 'mysql2/promise';

// Pool de conexões reaproveitado por toda a aplicação
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'otimiza_treino',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,      // datas chegam como 'AAAA-MM-DD'
  decimalNumbers: true    // DECIMAL chega como number
});

/** Executa `fn` dentro de uma transação, com commit/rollback automático. */
export async function emTransacao(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}
