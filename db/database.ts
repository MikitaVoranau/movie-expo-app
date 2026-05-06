import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'movievault.db';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  const tableInfo = await db.getFirstAsync<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_lists'"
  );

  if (tableInfo?.sql?.includes('CHECK')) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_lists_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        poster_url TEXT,
        list_type TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        rating REAL,
        notes TEXT,
        UNIQUE(movie_id, list_type)
      );
      INSERT OR IGNORE INTO user_lists_new (id, movie_id, title, poster_url, list_type, added_at, rating, notes)
        SELECT id, movie_id, title, poster_url, list_type, added_at, rating, notes FROM user_lists;
      DROP TABLE user_lists;
      ALTER TABLE user_lists_new RENAME TO user_lists;
    `);
  } else {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        poster_url TEXT,
        list_type TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        rating REAL,
        notes TEXT,
        UNIQUE(movie_id, list_type)
      );
    `);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_lists_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      movie_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_url TEXT,
      list_type TEXT NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      rating REAL,
      notes TEXT,
      UNIQUE(user_id, movie_id, list_type)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_collections_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, name)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );
  `);
}

const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getCached<T>(key: string): Promise<T | null> {
  const row = await db.getFirstAsync<{ data: string; cached_at: number }>(
    'SELECT data, cached_at FROM api_cache WHERE cache_key = ?',
    [key]
  );
  if (!row) return null;
  const age = Date.now() - row.cached_at;
  if (age > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(row.data) as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO api_cache (cache_key, data, cached_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(data), Date.now()]
  );
}

export async function clearCache(): Promise<void> {
  await db.runAsync('DELETE FROM api_cache');
}
export interface UserListItem {
  id: number;
  movie_id: number;
  title: string;
  poster_url: string | null;
  list_type: 'watchlist' | 'favorites' | 'watched' | 'liked' | string;
  added_at: string;
  rating: number | null;
  notes: string | null;
}

export interface UserCollection {
  id: number;
  name: string;
  created_at: string;
}

export async function addToList(
  item: Omit<UserListItem, 'id' | 'added_at'>
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO user_lists (movie_id, title, poster_url, list_type, rating, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.movie_id, item.title, item.poster_url, item.list_type, item.rating, item.notes]
  );
}

export async function getListItems(listType: string): Promise<UserListItem[]> {
  return db.getAllAsync<UserListItem>(
    'SELECT * FROM user_lists WHERE list_type = ? ORDER BY added_at DESC',
    [listType]
  );
}

export async function isInList(movieId: number, listType: string): Promise<boolean> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_lists WHERE movie_id = ? AND list_type = ?',
    [movieId, listType]
  );
  return (result?.count ?? 0) > 0;
}

export async function updateListItem(
  id: number,
  updates: { rating?: number | null; notes?: string | null }
): Promise<void> {
  const fields: string[] = [];
  const values: (number | string | null)[] = [];

  if (updates.rating !== undefined) {
    fields.push('rating = ?');
    values.push(updates.rating);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE user_lists SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function removeFromList(movieId: number, listType: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM user_lists WHERE movie_id = ? AND list_type = ?',
    [movieId, listType]
  );
}

export async function getListCounts(): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ list_type: string; count: number }>(
    'SELECT list_type, COUNT(*) as count FROM user_lists GROUP BY list_type'
  );
  return Object.fromEntries(rows.map((r) => [r.list_type, r.count]));
}

export async function createCollection(name: string): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO user_collections (name) VALUES (?)',
    [name]
  );
  return result.lastInsertRowId;
}

export async function getCollections(): Promise<UserCollection[]> {
  return db.getAllAsync<UserCollection>(
    'SELECT * FROM user_collections ORDER BY created_at DESC'
  );
}

export async function deleteCollection(id: number): Promise<void> {
  const listType = `collection:${id}`;
  await db.runAsync('DELETE FROM user_lists WHERE list_type = ?', [listType]);
  await db.runAsync('DELETE FROM user_collections WHERE id = ?', [id]);
}

export async function addToCollection(
  collectionId: number,
  movieData: { movie_id: number; title: string; poster_url: string | null }
): Promise<void> {
  await addToList({
    movie_id: movieData.movie_id,
    title: movieData.title,
    poster_url: movieData.poster_url,
    list_type: `collection:${collectionId}`,
    rating: null,
    notes: null,
  });
}

export async function getCollectionItems(collectionId: number): Promise<UserListItem[]> {
  return getListItems(`collection:${collectionId}`);
}

export async function removeFromCollection(collectionId: number, movieId: number): Promise<void> {
  await removeFromList(movieId, `collection:${collectionId}`);
}

export async function getWatchedGenreStats(): Promise<{ counts: Record<number, number>; totalMovies: number }> {
  const items = await getListItems('watched');
  const counts: Record<number, number> = {};
  const totalMovies = items.length;

  for (const item of items) {
    if (!item.notes) continue;
    try {
      const parsed = JSON.parse(item.notes);
      const genreIds: number[] = parsed.genre_ids ?? [];
      for (const gid of genreIds) {
        counts[gid] = (counts[gid] ?? 0) + 1;
      }
    } catch {
    }
  }

  return { counts, totalMovies };
}

export async function clearWatchedHistory(): Promise<void> {
  await db.runAsync('DELETE FROM user_lists WHERE list_type = ?', ['watched']);
}

/**
 * Очищает все данные пользователя из локальной базы
 * Используется при смене аккаунта
 */
export async function clearAllUserData(): Promise<void> {
  await db.runAsync('DELETE FROM user_lists');
  await db.runAsync('DELETE FROM user_collections');
  console.log('✓ Local database cleared');
}
