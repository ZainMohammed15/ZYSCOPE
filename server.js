// Minimal Express server with basic middleware, health check, and guest login.

const path = require('path');
const express = require('express');
const cors = require('cors');
const {
  createUser,
  getUserById,
  getUserByUsername,
  updateUsername,
  updateUserProfile,
  updateUserProgress,
  deleteUser,
  addVisit,
  getVisitsByUser,
  addReview,
  getReviewsByLocation,
  getRecentReviews,
  getLeaderboard,
  getUserVisitCount,
  getUserAverageRating,
  dbReady,
} = require('./db');
const cities = require('./data.json');

const app = express();
const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, 'dist');

// Enable JSON body parsing and allow cross-origin requests. Increase limit to handle base64 profile images.
app.use(express.json({ limit: '8mb' }));
// Allow local dev origins; tighten for production as needed
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [undefined, 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    // permissive during dev; replace with exact list when deploying
    return cb(null, true);
  },
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check endpoint for monitoring.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Help content endpoint for keyboard shortcuts and platform notes.
app.get('/help', async (_req, res) => {
  try {
    const shortcuts = [
      { keys: 'Arrow keys', desc: 'Navigate map markers (Explore) and switch focus items.' },
      { keys: 'Enter', desc: 'Toggle visited on the active marker (Explore).' },
      { keys: 'Tab / Shift+Tab', desc: 'Move between interactive controls and inputs.' },
    ];

    const platformNotes = [
      {
        title: 'Desktop',
        body: 'Use keyboard navigation for speed. Most interactions support Enter/Space activation.',
      },
      {
        title: 'Mobile',
        body: 'Tap markers and cards; sticky nav keeps primary actions reachable.',
      },
      {
        title: 'Accessibility',
        body: 'High-contrast theme, focusable controls, and semantic headings throughout.',
      },
    ];

    res.json({ shortcuts, platformNotes, message: 'Live help available' });
  } catch (err) {
    console.error('Failed to handle /help GET:', err.message);
    res.status(500).json({ error: 'Unable to load help content.' });
  }
});

// Return the full list of cities from static data.
app.get('/cities', (req, res) => {
  res.json(cities);
});

// Helper to find a city by name (case-insensitive, trimmed).
function findCityByName(name) {
  if (!name || typeof name !== 'string') return null;
  const target = name.trim().toLowerCase();
  return cities.find((city) => city.name.toLowerCase() === target) || null;
}

// Normalize the city shape for responses.
function formatCity(city) {
  return {
    name: city.name,
    country: city.country,
    latitude: city.lat !== undefined ? city.lat : city.latitude,
    longitude: city.lon !== undefined ? city.lon : city.longitude,
    lat: city.lat !== undefined ? city.lat : city.latitude,
    lon: city.lon !== undefined ? city.lon : city.longitude,
    adventure: city.adventure,
    study: city.study,
    travel: city.travel,
    scores: {
      adventure: city.adventure,
      study: city.study,
      travel: city.travel,
    },
  };
}


// Compute leveled XP based on visits. Simple curve: +25 points per visit, 250 points per level.
function nextPoints(currentPoints = 0, increment = 25) {
  const total = (currentPoints || 0) + increment;
  const level = Math.max(1, Math.floor(total / 250) + 1);
  return { total, level };
}
// Compare two cities by returning their travel-related scores.
app.post('/compare', async (req, res) => {
  const { city1, city2 } = req.body || {};

  if (!city1 || !city2) {
    return res.status(400).json({ error: 'Both city1 and city2 are required.' });
  }

  try {
    const first = findCityByName(city1);
    const second = findCityByName(city2);

    if (!first || !second) {
      return res.status(404).json({ error: 'One or both countries were not found.' });
    }

    res.json({
      city1: formatCity(first),
      city2: formatCity(second),
    });
  } catch (err) {
    console.error('Failed to handle /compare:', err.message);
    res.status(500).json({ error: 'Unable to compare countries.' });
  }
});

// Create a review for a city.
app.post('/reviews', async (req, res) => {
  const { user_id, location, rating, comment } = req.body || {};

  const numericRating = Number(rating);
  if (!user_id || !location || !Number.isFinite(numericRating)) {
    return res.status(400).json({ error: 'user_id, location, and numeric rating are required.' });
  }
  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'rating must be between 1 and 5.' });
  }

  try {
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const city = findCityByName(location);
    if (!city) {
      return res.status(404).json({ error: 'Country not found.' });
    }

    const review = await addReview(user.id, city.name, numericRating, comment);

    res.json({
      user: { id: user.id, username: user.username },
      city: formatCity(city),
      review,
    });
  } catch (err) {
    console.error('Failed to handle /reviews POST:', err.message);
    res.status(500).json({ error: 'Unable to save review.' });
  }
});

// Get all reviews for a specific city.
app.get('/reviews', async (req, res) => {
  const location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: 'location query parameter is required.' });
  }

  try {
    const city = findCityByName(location);
    if (!city) {
      return res.status(404).json({ error: 'Country not found.' });
    }

    const reviews = await getReviewsByLocation(city.name);
    res.json({ city: formatCity(city), reviews });
  } catch (err) {
    console.error('Failed to handle /reviews GET:', err.message);
    res.status(500).json({ error: 'Unable to fetch reviews.' });
  }
});

// Get the most recent reviews (default 10).
app.get('/reviews/recent', async (_req, res) => {
  try {
    const reviews = await getRecentReviews(10);
    const withMeta = await Promise.all(
      reviews.map(async (r) => {
        const reviewer = await getUserById(r.user_id).catch(() => null);
        const city = findCityByName(r.location);
        return {
          ...r,
          user: reviewer ? { id: reviewer.id, username: reviewer.username } : null,
          city: city ? formatCity(city) : null,
        };
      })
    );
    res.json({ reviews: withMeta });
  } catch (err) {
    console.error('Failed to handle /reviews/recent GET:', err.message);
    res.status(500).json({ error: 'Unable to fetch recent reviews.' });
  }
});

// Leaderboard of top users by points and level.
app.get('/leaderboard', async (_req, res) => {
  try {
    const users = await getLeaderboard(10);
    const withStats = await Promise.all(
      users.map(async (u) => {
        const visits = await getUserVisitCount(u.id);
        const avgRating = await getUserAverageRating(u.id);
        return {
          ...u,
          visits,
          avgRating,
        };
      })
    );
    res.json({ users: withStats });
  } catch (err) {
    console.error('Failed to handle /leaderboard GET:', err.message);
    res.status(500).json({ error: 'Unable to fetch leaderboard.' });
  }
});

// Mark a city as visited for a user.
app.post('/explore', async (req, res) => {
  const { user_id, location } = req.body || {};

  if (!user_id || !location) {
    return res.status(400).json({ error: 'user_id and location are required.' });
  }

  try {
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const city = findCityByName(location);
    if (!city) {
      return res.status(404).json({ error: 'Country not found.' });
    }

    const visit = await addVisit(user.id, city.name);

    // Award points for each visit and level up accordingly.
    const { total, level } = nextPoints(user.points, 25);
    await updateUserProgress(user.id, total, level);
    const updatedUser = await getUserById(user.id);

    res.json({
      user: { id: updatedUser.id, username: updatedUser.username, points: updatedUser.points, level: updatedUser.level },
      city: formatCity(city),
      visit: {
        id: visit.id,
        visited_at: visit.visited_at,
        location: visit.location,
      },
    });
  } catch (err) {
    console.error('Failed to handle /explore:', err.message);
    res.status(500).json({ error: 'Unable to record visit.' });
  }
});

// List visits for a user.
app.get('/visits', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const visits = await getVisitsByUser(userId);
    const enriched = visits.map((v) => {
      const city = findCityByName(v.location);
      return {
        ...v,
        city: city ? formatCity(city) : null,
      };
    });
    res.json({ user: { id: user.id, username: user.username, level: user.level, points: user.points }, visits: enriched });
  } catch (err) {
    console.error('Failed to handle /visits GET:', err.message);
    res.status(500).json({ error: 'Unable to fetch visits.' });
  }
});

// Generate a simple guest username that is likely unique.
function generateGuestUsername() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `guest_${Date.now()}_${suffix}`;
}

// Guest login endpoint: creates or returns a user by username.
app.post('/user/login', async (req, res) => {
  const providedUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const username = providedUsername || generateGuestUsername();

  try {
    let user;

    try {
      user = await createUser(username);
    } catch (err) {
      // If the username already exists, return the existing user instead of failing.
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        user = await getUserByUsername(username);
      } else {
        throw err;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User could not be found or created' });
    }

    res.json(user);
  } catch (err) {
    console.error('Failed to handle /user/login:', err.message);
    res.status(500).json({ error: 'Unable to process login' });
  }
});

// Social auth endpoints (demo mode - in production, implement OAuth)
app.post('/api/auth/:provider', async (req, res) => {
  const { provider } = req.params;
  
  try {
    // In production, validate OAuth token and get user info from provider
    // For demo, create user with provider info
    const username = `${provider}_${Date.now()}`;
    const user = await createUser(username);
    res.json({ user: { ...user, provider } });
  } catch (err) {
    console.error('Social auth error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Update a user's profile (username, email, bio, profile picture).
app.put('/user/update', async (req, res) => {
  const userId = Number(req.body?.user_id);
  const nextUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const email = req.body?.email || null;
  const bio = req.body?.bio || null;
  const profilePic = req.body?.profilePic || req.body?.avatar || null;

  if (!userId || !nextUsername) {
    return res.status(400).json({ error: 'user_id and username are required.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await updateUserProfile(userId, {
      username: nextUsername,
      email,
      bio,
      profilePic,
    });

    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      bio: updated.bio,
      profilePic: updated.profile_pic,
      level: updated.level,
      points: updated.points,
    });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    console.error('Failed to handle /user/update:', err.message);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
});

// Mini-game XP endpoint - award XP from WeatherScot game
app.post('/minigame/xp', async (req, res) => {
  const userId = Number(req.body?.userId);
  const xp = Number(req.body?.xp);
  
  if (!userId || !Number.isFinite(xp) || xp < 0) {
    return res.status(400).json({ error: 'userId and valid xp amount required.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Add XP to user points; preserve current level
    const newPoints = (user.points || 0) + xp;
    await updateUserProgress(userId, newPoints, user.level);
    
    res.json({ 
      success: true, 
      xpAwarded: xp, 
      totalPoints: newPoints 
    });
  } catch (err) {
    console.error('Failed to award mini-game XP:', err.message);
    res.status(500).json({ error: 'Unable to save XP.' });
  }
});

// Unified XP add endpoint for Phaser game UI
app.post('/xp/add', async (req, res) => {
  const userId = Number(req.body?.userId || req.body?.user_id);
  const xp = Number(req.body?.xp);

  if (!userId || !Number.isFinite(xp) || xp < 0) {
    return res.status(400).json({ error: 'userId and valid xp amount required.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newPoints = (user.points || 0) + xp;
    // Preserve level if helper requires both; otherwise updater will handle default
    await updateUserProgress(userId, newPoints, user.level);
    const updated = await getUserById(userId);
    res.json({ success: true, xpAwarded: xp, totalPoints: updated.points, level: updated.level });
  } catch (err) {
    console.error('Failed to handle /xp/add:', err.message);
    res.status(500).json({ error: 'Unable to save XP.' });
  }
});

// Logout endpoint (stateless placeholder to align with client expectations).
app.post('/user/logout', async (_req, res) => {
  res.json({ status: 'ok', message: 'Logged out' });
});

// Delete a user account.
app.delete('/user/delete', async (req, res) => {
  const userId = Number(req.body?.user_id);
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await deleteUser(userId);
    res.json({ status: 'ok', message: 'User deleted' });
  } catch (err) {
    console.error('Failed to handle /user/delete:', err.message);
    res.status(500).json({ error: 'Unable to delete user.' });
  }
});

// API endpoint to select logo variant
app.post('/api/select-logo', (req, res) => {
  const { logoName } = req.body;
  const validLogos = [
    'premium-globe',
    'minimalist-pin',
    'neon-compass',
    'gradient-travel',
    'geometric-sphere'
  ];
  
  if (!logoName || !validLogos.includes(logoName)) {
    return res.status(400).json({ error: 'Invalid logo name' });
  }
  
  try {
    const fs = require('fs');
    const logoPath = path.join(__dirname, 'public', `logo-${logoName}.png`);
    const targetPath = path.join(__dirname, 'public', 'logo.png');
    
    // Copy selected logo to main logo file
    fs.copyFileSync(logoPath, targetPath);
    res.json({ success: true, message: `Logo updated to ${logoName}` });
  } catch (err) {
    console.error('Logo update error:', err);
    res.status(500).json({ error: 'Failed to update logo' });
  }
});

// Serve built frontend assets when available and keep SPA routes working on refresh.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(FRONTEND_DIR));
  // Express 5 / path-to-regexp v6: use a RegExp catch-all
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
}

// Start the HTTP server only after database is ready.
(async () => {
  try {
    await dbReady;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
})();
