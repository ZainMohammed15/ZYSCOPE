// Simple SQLite helper using sqlite3 with a single users table.
// Foreign keys are enabled and the schema is created on startup.

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'zyscope.sqlite');

// Promise-based database initialization
const dbReady = new Promise((resolve, reject) => {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Failed to open database:', err.message);
      reject(err);
      return;
    }

    // Initialize schema with proper completion tracking
    let pendingOps = 6; // Number of operations to complete
    const checkComplete = () => {
      pendingOps--;
      if (pendingOps === 0) resolve(db);
    };

    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');

      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          level INTEGER DEFAULT 1,
          points INTEGER DEFAULT 0,
          email TEXT,
          bio TEXT,
          profile_pic TEXT
        )`,
        (err) => {
          if (err && err.message.includes('already exists')) {
            // Table already exists, decrement twice
            checkComplete();
            checkComplete();
          } else {
            checkComplete();
          }
        }
      );

      db.run('ALTER TABLE users ADD COLUMN email TEXT', (err) => {
        if (err && !String(err.message).includes('duplicate column name')) {
          console.warn('Skipping email column:', err.message);
        }
        checkComplete();
      });

      db.run('ALTER TABLE users ADD COLUMN bio TEXT', (err) => {
        if (err && !String(err.message).includes('duplicate column name')) {
          console.warn('Skipping bio column:', err.message);
        }
        checkComplete();
      });

      db.run('ALTER TABLE users ADD COLUMN profile_pic TEXT', (err) => {
        if (err && !String(err.message).includes('duplicate column name')) {
          console.warn('Skipping profile_pic column:', err.message);
        }
        checkComplete();
      });

      db.run(
        `CREATE TABLE IF NOT EXISTS visits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          location TEXT NOT NULL,
          visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        checkComplete
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          location TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        checkComplete
      );
    });
  });
});

// Get database instance only after initialization
async function getDb() {
  return dbReady;
}

const db = { ready: dbReady };

// Helper to wrap db.get in a Promise.
async function get(sql, params = []) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    database.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Helper to wrap db.all in a Promise.
async function all(sql, params = []) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Helper to wrap db.run in a Promise, exposing the lastID.
async function run(sql, params = []) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Create a new user with a unique username.
async function createUser(username) {
  const result = await run('INSERT INTO users (username) VALUES (?)', [username]);
  return getUserById(result.lastID);
}

// Fetch a single user by their numeric id.
async function getUserById(id) {
  return get('SELECT id, username, level, points, email, bio, profile_pic FROM users WHERE id = ?', [id]);
}

// Retrieve all users ordered by id.
async function listUsers() {
  return all('SELECT id, username, level, points, email, bio, profile_pic FROM users ORDER BY id ASC');
}

// Record a visited city for a user and return the saved row.
async function addVisit(userId, location) {
  const result = await run('INSERT INTO visits (user_id, location) VALUES (?, ?)', [userId, location]);
  return get('SELECT id, user_id, location, visited_at FROM visits WHERE id = ?', [result.lastID]);
}

// List visits for a user, newest first.
async function getVisitsByUser(userId) {
  return all(
    'SELECT id, user_id, location, visited_at FROM visits WHERE user_id = ? ORDER BY visited_at DESC, id DESC',
    [userId]
  );
}

// Fetch a single user by their unique username.
async function getUserByUsername(username) {
  return get('SELECT id, username, level, points, email, bio, profile_pic FROM users WHERE username = ?', [username]);
}

// Insert a review for a city and return the stored row.
async function addReview(userId, location, rating, comment) {
  const result = await run(
    'INSERT INTO reviews (user_id, location, rating, comment) VALUES (?, ?, ?, ?)',
    [userId, location, rating, comment || null]
  );
  return get('SELECT id, user_id, location, rating, comment, created_at FROM reviews WHERE id = ?', [result.lastID]);
}

// Update a user's username; fails if the username already exists.
async function updateUsername(userId, newUsername) {
  // Attempt update; UNIQUE constraint will raise an error if the name exists.
  await run('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
  return getUserById(userId);
}

// Update username plus optional profile fields.
async function updateUserProfile(userId, { username, email = null, bio = null, profilePic = null }) {
  await run('UPDATE users SET username = ?, email = ?, bio = ?, profile_pic = ? WHERE id = ?', [
    username,
    email,
    bio,
    profilePic,
    userId,
  ]);
  return getUserById(userId);
}

// Update points and level for a user.
async function updateUserProgress(userId, points, level) {
  await run('UPDATE users SET points = ?, level = ? WHERE id = ?', [points, level, userId]);
  return getUserById(userId);
}

// Delete a user and cascade to visits/reviews via FK constraints.
async function deleteUser(userId) {
  await run('DELETE FROM users WHERE id = ?', [userId]);
  return { status: 'ok' };
}

// Get all reviews for a specific location (case-insensitive).
async function getReviewsByLocation(location) {
  return all(
    'SELECT id, user_id, location, rating, comment, created_at FROM reviews WHERE LOWER(location) = LOWER(?) ORDER BY created_at DESC',
    [location]
  );
}

// Get the most recent reviews, limited by the provided count (default 10).
async function getRecentReviews(limit = 10) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  return all(
    'SELECT id, user_id, location, rating, comment, created_at FROM reviews ORDER BY created_at DESC LIMIT ?',
    [safeLimit]
  );
}

// Get top users ordered by points then level.
async function getLeaderboard(limit = 10) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  return all(
    'SELECT id, username, level, points FROM users ORDER BY points DESC, level DESC, id ASC LIMIT ?',
    [safeLimit]
  );
}

// Count visits for a user.
async function getUserVisitCount(userId) {
  const row = await get('SELECT COUNT(*) as count FROM visits WHERE user_id = ?', [userId]);
  return row?.count || 0;
}

// Average rating given by a user across their reviews.
async function getUserAverageRating(userId) {
  const row = await get('SELECT AVG(rating) as avg FROM reviews WHERE user_id = ?', [userId]);
  return row?.avg ? Number(row.avg.toFixed(2)) : null;
}

module.exports = {
  dbReady,
  createUser,
  getUserById,
  listUsers,
  addVisit,
  getVisitsByUser,
  getUserByUsername,
  updateUsername,
  updateUserProfile,
  updateUserProgress,
  deleteUser,
  addReview,
  getReviewsByLocation,
  getRecentReviews,
  getLeaderboard,
  getUserVisitCount,
  getUserAverageRating,
};
