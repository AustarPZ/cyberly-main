require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { createPool } = require('./src/database/pool');
const { getAgeGroup } = require('./src/database/age-group');
const {
    isValidEmail,
    normalizeEmail,
    validateRegistration,
} = require('./src/auth/validation');
const MySqlSessionStore = require('./src/auth/mysql-session-store');
const { requireAuth, requireRole } = require('./src/auth/middleware');
const { createProfileRepository } = require('./src/profile/profile.repository');
const { createProfileService } = require('./src/profile/profile.service');
const { createProfileRouter } = require('./src/profile/profile.routes');
const { createAssessmentRepository } = require('./src/assessment/assessment.repository');
const { createAssessmentService } = require('./src/assessment/assessment.service');
const { createAssessmentRouter } = require('./src/assessment/assessment.routes');
const { createProgressRepository } = require('./src/progress/progress.repository');
const { createProgressService } = require('./src/progress/progress.service');
const { createProgressRouter } = require('./src/progress/progress.routes');
const { createScenarioRepository } = require('./src/scenario/scenario.repository');
const { createScenarioService } = require('./src/scenario/scenario.service');
const { createScenarioRouter } = require('./src/scenario/scenario.routes');
const { createResourceRepository } = require('./src/resource/resource.repository');
const { createResourceService } = require('./src/resource/resource.service');
const { createResourceRouter } = require('./src/resource/resource.routes');
const { createAccountRepository } = require("./src/account/account.repository");
const { createAccountService } = require("./src/account/account.service");
const { createAccountRouter } = require("./src/account/account.routes");
const { ERROR_CODES } = require('./src/errors/errorCodes');

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const sessionName = process.env.SESSION_NAME || 'cyberly.sid';
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS || 86400);
const isProduction = process.env.NODE_ENV === 'production';
const pool = createPool();
const profileRepository = createProfileRepository(pool);
const profileService = createProfileService(profileRepository);
const accountRepository = createAccountRepository(pool);
const accountService = createAccountService(accountRepository);
const assessmentRepository = createAssessmentRepository(pool);
const progressRepository = createProgressRepository(pool);
const progressService = createProgressService(progressRepository);
const assessmentService = createAssessmentService(assessmentRepository, progressService);
const scenarioRepository = createScenarioRepository(pool);
const scenarioService = createScenarioService(scenarioRepository, progressService);
const resourceRepository = createResourceRepository(pool);
const resourceService = createResourceService(resourceRepository);

app.set('trust proxy', 1);
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(session({
    name: sessionName,
    secret: process.env.SESSION_SECRET || 'development-only-session-secret-change-me',
    store: new MySqlSessionStore(pool, sessionTtlSeconds),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: sessionTtlSeconds * 1000,
    },
    saveUninitialized: false,
    resave: false,
}));
app.use('/api/profile', createProfileRouter(profileService));
app.use("/api/account", createAccountRouter(accountService));
app.use(createAssessmentRouter(assessmentService));
app.use(createProgressRouter(progressService));
app.use(createScenarioRouter(scenarioService));
app.use(createResourceRouter(resourceService));

const rateLimitBuckets = new Map();

function authRateLimit(req, res, next) {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 20;
    const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);

    if (bucket.count > maxAttempts) {
        return res.status(429).json({
            code: ERROR_CODES.AUTH_RATE_LIMITED,
            message: 'Too many authentication attempts. Please try again later.',
        });
    }

    next();
}

function buildSafeUser(row) {
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        age: row.age,
        ageGroup: row.age_group,
        role: row.role,
        accountStatus: row.account_status,
    };
}

async function findSafeUserById(userId) {
    const [rows] = await pool.query(
        `SELECT id, email, display_name, age, age_group, role, account_status
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );
    return rows[0] || null;
}

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) return resolve();
        req.session.destroy((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

async function establishSession(req, user) {
    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.role = user.role;
    await saveSession(req);
}

app.get('/api/health', async (_req, res, next) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/register', authRateLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const displayName = String(req.body.displayName || '').trim();
        const password = String(req.body.password || '');
        const age = Number(req.body.age);
        const ageGroup = getAgeGroup(age);
        const validation = validateRegistration({ email, displayName, password, age });

        if (!validation.ok) {
            return res.status(400).json({
                code: ERROR_CODES.AUTH_REGISTRATION_INVALID,
                message: 'Registration details are invalid.',
                errors: validation.errors,
            });
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existing.length > 0) {
            return res.status(409).json({
                code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED,
                message: 'An account with this email already exists.',
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users
                (email, display_name, age, age_group, password_hash, role, account_status)
             VALUES (?, ?, ?, ?, ?, 'user', 'active')`,
            [email, displayName, age, ageGroup, passwordHash]
        );

        const userRow = await findSafeUserById(result.insertId);
        await establishSession(req, userRow);
        const profile = await profileService.getProfileForUser(userRow.id);
        res.status(201).json({ user: buildSafeUser(userRow), profile });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/login', authRateLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!isValidEmail(email) || !password) {
            return res.status(400).json({
                code: ERROR_CODES.AUTH_LOGIN_FIELDS_REQUIRED,
                message: 'Email and password are required.',
            });
        }

        const [rows] = await pool.query(
            `SELECT id, email, display_name, age, age_group, password_hash, role, account_status
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        const invalidMessage = 'Invalid email or password.';
        if (rows.length === 0) {
            return res.status(401).json({
                code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                message: invalidMessage,
            });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
                message: invalidMessage,
            });
        }

        if (user.account_status !== 'active') {
            return res.status(403).json({
                code: ERROR_CODES.AUTH_ACCOUNT_DISABLED,
                message: 'This account is disabled.',
            });
        }

        await establishSession(req, user);
        const profile = await profileService.getProfileForUser(user.id);
        res.json({ user: buildSafeUser(user), profile });
    } catch (error) {
        next(error);
    }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
    try {
        const user = await findSafeUserById(req.session.userId);
        if (!user || user.account_status !== 'active') {
            await destroySession(req);
            res.clearCookie(sessionName);
            return res.status(401).json({
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Authentication required.',
            });
        }

        req.session.role = user.role;
        await saveSession(req);
        const profile = await profileService.getProfileForUser(user.id);
        res.json({ user: buildSafeUser(user), profile });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/logout', async (req, res, next) => {
    try {
        await destroySession(req);
        res.clearCookie(sessionName, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
        });
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

app.get('/api/admin/ping', requireRole('admin'), (_req, res) => {
    res.json({ ok: true });
});

// Legacy routes are retained temporarily but use password hashes only.
app.post('/api/register', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const displayName = String(req.body.username || '').trim();
        const password = String(req.body.password || '');
        const age = Number(req.body.age);
        const ageGroup = getAgeGroup(age);
        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (username, email, display_name, age, age_group, password_hash, role, account_status)
             VALUES (?, ?, ?, ?, ?, ?, 'user', 'active')`,
            [displayName, email, displayName, age, ageGroup, passwordHash]
        );
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        next(error);
    }
});

app.post('/api/login', async (req, res, next) => {
    try {
        const username = String(req.body.username || '').trim();
        const password = String(req.body.password || '');
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (rows.length === 0) {
            return res.status(401).json({
                code: ERROR_CODES.AUTH_LEGACY_INVALID_CREDENTIALS,
                message: 'Invalid username or password.',
            });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                code: ERROR_CODES.AUTH_LEGACY_INVALID_CREDENTIALS,
                message: 'Invalid username or password.',
            });
        }

        res.json({ user: buildSafeUser(user) });
    } catch (error) {
        next(error);
    }
});

app.use((error, _req, res, _next) => {
    console.error('Server error:', error.code || error.message);
    if (error.status && error.status < 500) {
        return res.status(error.status).json({
            code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: error.message,
            ...(error.errors ? { errors: error.errors } : {}),
        });
    }
    res.status(500).json({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Server error.',
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
