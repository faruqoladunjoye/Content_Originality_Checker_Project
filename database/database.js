import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import uuid from 'uuid-random';


async function init() {
  const db = await open({
    filename: './database/files.sqlite',
    driver: sqlite3.Database,
  });
  console.log('Connected to the SQLite database.');
  await db.migrate({ migrationsPath: './database/sqlite' });
  return db;
}

const dbCon = init();

export async function getAll() {
  const db = await dbCon;
  return db.all('SELECT * FROM files');
}

export async function addFile(name, path) {
  const db = await dbCon;
  const id = uuid();
  await db.run('INSERT INTO Files VALUES (?,?,?)', [id, name, path]);
  return getAll();
}
