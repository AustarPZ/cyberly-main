require('dotenv').config();

const { validateProductionConfig } = require('./src/config/productionConfig');

let productionConfig;
try {
    productionConfig = validateProductionConfig(process.env);
} catch (error) {
    console.error(`Production configuration error: ${error.message}`);
    process.exit(1);
}

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { createPool, getDatabaseErrorSummary } = require('./src/database/pool');
const { getAgeGroup } = require('./src/database/age-group');
const {
    isValidEmail,
    normalizeEmail,
    validatePassword,
    validateRegistration,
} = require('./src/auth/validation');
const MySqlSessionStore = require('./src/auth/mysql-session-store');
const { applyAuthenticatedSession } = require('./src/auth/sessionVersion');
const { createPasswordResetRepository } = require('./src/auth/passwordReset.repository');
const { createPasswordResetTokenService } = require('./src/auth/passwordResetToken.service');
const { requireAuth } = require('./src/auth/middleware');
const { createRequireVerifiedEmail } = require('./src/auth/emailVerification.middleware');
const { createEmailVerificationRepository } = require('./src/auth/emailVerification.repository');
const {
    DEFAULT_EXPIRY_HOURS,
    DEFAULT_RESEND_COOLDOWN_SECONDS,
    EMAIL_VERIFICATION_TOKEN_TYPE,
    createEmailVerificationTokenService,
} = require('./src/auth/emailVerification.service');
const {
    buildVerificationLink,
    createEmailVerificationSender,
} = require('./src/auth/emailVerificationEmail.service');
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
const { createChatRepository } = require('./src/chat/chat.repository');
const { createChatService } = require('./src/chat/chat.service');
const { createChatRouter } = require('./src/chat/chat.routes');
const { createAiConfig } = require('./src/ai/ai.config');
const { createAiProvider } = require('./src/ai/ai.provider');
const { createAiRepository } = require('./src/ai/ai.repository');
const { createAiService } = require('./src/ai/ai.service');
const { createAiRouter } = require('./src/ai/ai.routes');
const { createRagRepository } = require('./src/rag/rag.repository');
const { createRagService } = require('./src/rag/rag.service');
const { createAgentService } = require('./src/agent/agent.service');
const { createControlledAgenticService } = require('./src/agent/controlledAgentic.service');
const { createActionProposalRouter } = require('./src/agent/actions/actionProposal.routes');
const { createActionProposalService } = require('./src/agent/actions/actionProposal.service');
const { createAdaptiveLearningService } = require('./src/adaptive/adaptiveLearning.service');
const { createAgenticTraceRepository } = require('./src/agent/audit/agenticTrace.repository');
const { createAgenticTraceService } = require('./src/agent/audit/agenticTrace.service');
const { createCyberWellnessService } = require('./src/wellness/cyberWellness.service');
const { createAdminRouter } = require('./src/admin/admin.routes');
const { ERROR_CODES } = require('./src/errors/errorCodes');
const {
    createCorsOptions,
    createOriginProtection,
    createSecurityHeadersMiddleware,
} = require('./src/security/httpSecurity');
const { createAuthRateLimiters } = require('./src/security/rateLimitPolicies');

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = productionConfig.clientOrigin || process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const clientBaseUrl = productionConfig.clientBaseUrl || process.env.CLIENT_BASE_URL || '';
const sessionName = process.env.SESSION_NAME || 'cyberly.sid';
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS || 86400);
const isProduction = process.env.NODE_ENV === 'production';
const sessionCookieSameSite = normalizeSameSite(
    productionConfig.sessionCookieSameSite || process.env.SESSION_COOKIE_SAMESITE || 'lax'
);
const sessionCookieSecure = isProduction || sessionCookieSameSite === 'none';
const pool = createPool();
const profileRepository = createProfileRepository(pool);
const profileService = createProfileService(profileRepository);
const emailVerificationRepository = createEmailVerificationRepository(pool);
const emailVerificationTokenService = createEmailVerificationTokenService(emailVerificationRepository);
const passwordResetRepository = createPasswordResetRepository(pool);
const passwordResetTokenService = createPasswordResetTokenService(passwordResetRepository);
const emailVerificationSender = createEmailVerificationSender({
    transport: process.env.EMAIL_TRANSPORT || 'disabled',
    fromName: process.env.EMAIL_FROM_NAME || 'Cyberly',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    clientBaseUrl,
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || '',
        secure: process.env.SMTP_SECURE || '',
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
    },
});
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
const chatRepository = createChatRepository(pool);
const aiConfig = createAiConfig();
const chatService = createChatService(chatRepository, {
    generationStaleMs: aiConfig.generationStaleMs,
});
const aiRepository = createAiRepository(pool);
const ragRepository = createRagRepository(pool);
const ragService = createRagService(ragRepository);
const agentService = createAgentService({ pool, ragService });
const agenticTraceRepository = createAgenticTraceRepository(pool);
const agenticTraceService = createAgenticTraceService(agenticTraceRepository);
const actionProposalService = createActionProposalService({
    pool,
    ttlSeconds: Number(process.env.ACTION_PROPOSAL_TTL_SECONDS || 180),
    agenticTraceService,
});
const aiProvider = createAiProvider(aiConfig);
const adaptiveLearningService = createAdaptiveLearningService({ repository: aiRepository });
const cyberWellnessService = createCyberWellnessService();
const controlledAgenticService = createControlledAgenticService({
    agentService,
    providerRegistry: aiProvider.registry,
    adaptiveLearningService,
});
const aiService = createAiService(aiRepository, aiProvider, aiConfig, {
    ragService,
    agentService,
    controlledAgenticService,
    actionProposalService,
    agenticTraceService,
    cyberWellnessService,
});

app.set('trust proxy', 1);
app.use(createSecurityHeadersMiddleware({ isProduction }));
app.use(cors(createCorsOptions(clientOrigin)));
app.use(createOriginProtection({
    allowedOrigin: clientOrigin,
    requireOrigin: isProduction,
}));
app.use(express.json({ limit: '32kb' }));
app.use(session({
    name: sessionName,
    secret: process.env.SESSION_SECRET || 'development-only-session-secret-change-me',
    store: new MySqlSessionStore(pool, sessionTtlSeconds),
    cookie: {
        httpOnly: true,
        sameSite: sessionCookieSameSite,
        secure: sessionCookieSecure,
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
app.use('/api/chat', createChatRouter(chatService));
app.use('/api/chat', createAiRouter(aiService, {
    requireVerifiedEmail: createRequireVerifiedEmail(pool),
}));
app.use(createActionProposalRouter(actionProposalService));
app.use('/api/admin', createAdminRouter(pool, { agenticTraceService }));

const {
    registration: registrationRateLimit,
    loginIp: loginIpRateLimit,
    loginAccount: loginAccountRateLimit,
    forgotPasswordIp: forgotPasswordIpRateLimit,
    forgotPasswordAccount: forgotPasswordAccountRateLimit,
    resetPasswordIp: resetPasswordIpRateLimit,
    resetPasswordToken: resetPasswordTokenRateLimit,
} = createAuthRateLimiters();

const PASSWORD_RESET_ACCEPTED_RESPONSE = {
    accepted: true,
    message: 'If an account matches that email, we’ll send a password reset link. Check your inbox and spam folder.',
};

function buildSafeUser(row) {
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        age: row.age,
        ageGroup: row.age_group,
        role: row.role,
        accountStatus: row.account_status,
        emailVerified: Boolean(row.email_verified_at),
        emailVerifiedAt: row.email_verified_at || null,
    };
}

async function findSafeUserById(userId) {
    const [rows] = await pool.query(
        `SELECT id, email, display_name, age, age_group, role, account_status,
                email_verified_at, session_version
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
    applyAuthenticatedSession(req.session, user);
    await saveSession(req);
}

function sendAuthError(res, status, code, message, extra = {}) {
    return res.status(status).json({
        error: {
            code,
            message,
        },
        ...extra,
    });
}

function getRequestLocale(req) {
    const candidate = String(req.body?.locale || req.query?.locale || req.headers['accept-language'] || 'en').toLowerCase();
    if (candidate.startsWith('ms')) return 'ms';
    if (candidate.startsWith('zh')) return 'zh-CN';
    return 'en';
}

function getVerificationUrl(rawToken) {
    return buildVerificationLink(clientBaseUrl || clientOrigin || 'http://localhost:3000', rawToken);
}

async function issueAndSendVerificationEmail(user, req) {
    const issued = await emailVerificationTokenService.issueEmailVerificationToken({
        userId: user.id,
        targetEmail: user.email,
        requestIp: req.ip || req.socket?.remoteAddress || null,
        requestUserAgent: req.get('user-agent') || null,
    });
    const delivery = await emailVerificationSender.sendEmailVerification({
        recipientEmail: user.email,
        learnerName: user.display_name || user.displayName || '',
        verificationUrl: getVerificationUrl(issued.rawToken),
        expiresAt: issued.expiresAt,
        locale: getRequestLocale(req),
    });

    if (!delivery.ok) {
        const failedAt = new Date();
        await emailVerificationRepository.revokeActiveTokens(user.id, EMAIL_VERIFICATION_TOKEN_TYPE, failedAt);
        await emailVerificationRepository.setUserVerificationState(user.id, {
            emailVerificationSentAt: null,
        });
        return {
            emailSent: false,
            emailTransportDisabled: false,
            failed: true,
        };
    }

    return {
        emailSent: !delivery.disabled,
        emailTransportDisabled: Boolean(delivery.disabled),
        failed: false,
    };
}

function verificationResponsePatch(sendResult = {}) {
    return {
        verification: {
            required: true,
            emailSent: Boolean(sendResult.emailSent),
            emailTransportDisabled: Boolean(sendResult.emailTransportDisabled),
            emailSendFailed: Boolean(sendResult.failed),
            expiresInSeconds: DEFAULT_EXPIRY_HOURS * 60 * 60,
        },
    };
}

app.get('/api/health', async (_req, res, next) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true });
    } catch (error) {
        console.error('Database health check failed:', getDatabaseErrorSummary(error));
        next(error);
    }
});

app.post('/api/auth/register', registrationRateLimit, async (req, res, next) => {
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
                (email, display_name, age, age_group, password_hash, role, account_status,
                 email_verified_at, email_verification_sent_at)
             VALUES (?, ?, ?, ?, ?, 'user', 'active', NULL, NULL)`,
            [email, displayName, age, ageGroup, passwordHash]
        );

        const userRow = await findSafeUserById(result.insertId);
        await establishSession(req, userRow);
        const profile = await profileService.getProfileForUser(userRow.id);
        let sendResult = { emailSent: false, emailTransportDisabled: true, failed: false };
        try {
            sendResult = await issueAndSendVerificationEmail(userRow, req);
        } catch {
            sendResult = { emailSent: false, emailTransportDisabled: false, failed: true };
        }
        res.status(201).json({ user: buildSafeUser(userRow), profile, ...verificationResponsePatch(sendResult) });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/login', loginIpRateLimit, loginAccountRateLimit, async (req, res, next) => {
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
            `SELECT id, email, display_name, age, age_group, password_hash, role, account_status,
                    email_verified_at, session_version
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

app.post(
    '/api/auth/forgot-password',
    forgotPasswordIpRateLimit,
    forgotPasswordAccountRateLimit,
    async (req, res) => {
        const email = normalizeEmail(req.body?.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({
                code: ERROR_CODES.PASSWORD_RESET_EMAIL_INVALID,
                message: 'Please enter a valid email address.',
            });
        }

        try {
            const account = await passwordResetRepository.findAccountByEmail(email);
            if (account?.role === 'user' && account.accountStatus === 'active') {
                await passwordResetTokenService.issuePasswordResetToken({
                    userId: account.id,
                    requestIp: req.ip || req.socket?.remoteAddress || null,
                    requestUserAgent: req.get('user-agent') || null,
                });
            }
        } catch {
            console.error('Password reset request failed: PASSWORD_RESET_REQUEST_FAILED');
        }

        return res.status(202).json(PASSWORD_RESET_ACCEPTED_RESPONSE);
    }
);

app.post(
    '/api/auth/reset-password',
    resetPasswordIpRateLimit,
    resetPasswordTokenRateLimit,
    async (req, res, next) => {
        try {
            const rawToken = String(req.body?.token || '').trim();
            if (!rawToken) {
                return res.status(400).json({
                    code: ERROR_CODES.PASSWORD_RESET_TOKEN_REQUIRED,
                    message: 'Password reset token is required.',
                });
            }

            const password = String(req.body?.password || '');
            const passwordError = validatePassword(password);
            if (passwordError) {
                return res.status(400).json({
                    code: ERROR_CODES.PASSWORD_RESET_PASSWORD_INVALID,
                    message: 'Password does not meet the required policy.',
                    errors: { password: passwordError },
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const reset = await passwordResetTokenService.completePasswordReset(rawToken, passwordHash);

            if (reset.status === 'expired') {
                return res.status(410).json({
                    code: ERROR_CODES.PASSWORD_RESET_TOKEN_EXPIRED,
                    message: 'Password reset link has expired.',
                });
            }

            if (reset.status !== 'reset') {
                return res.status(400).json({
                    code: ERROR_CODES.PASSWORD_RESET_TOKEN_INVALID_OR_UNAVAILABLE,
                    message: 'Password reset link is invalid or no longer available.',
                });
            }

            await destroySession(req);
            res.clearCookie(sessionName, {
                httpOnly: true,
                sameSite: sessionCookieSameSite,
                secure: sessionCookieSecure,
            });
            return res.json({ reset: true, authenticated: false });
        } catch (error) {
            return next(error);
        }
    }
);

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

app.post('/api/auth/verify-email', async (req, res, next) => {
    try {
        const rawToken = String(req.body?.token || '').trim();
        if (!rawToken) {
            return sendAuthError(
                res,
                400,
                ERROR_CODES.EMAIL_VERIFICATION_TOKEN_REQUIRED,
                'Verification token is required.'
            );
        }

        const verification = await emailVerificationRepository.transaction(async (repo) => {
            const scopedService = createEmailVerificationTokenService(repo);
            const inspected = await scopedService.inspectEmailVerificationToken(rawToken);

            if (inspected.status === 'missing') {
                return { status: 'invalid' };
            }

            if (inspected.status === 'expired' || inspected.status === 'revoked') {
                return { status: inspected.status };
            }

            const token = inspected.token;
            const user = await repo.getUserVerificationState(token.userId);
            if (!user) {
                return { status: 'invalid' };
            }

            const alreadyVerified = Boolean(user.emailVerifiedAt) || inspected.status === 'used';
            const verifiedAt = user.emailVerifiedAt || new Date();
            if (!user.emailVerifiedAt) {
                await repo.setUserVerificationState(user.id, { emailVerifiedAt: verifiedAt });
            }

            if (inspected.status === 'active') {
                await repo.markTokenUsed(token.id, verifiedAt);
            }
            await repo.revokeActiveTokens(user.id, EMAIL_VERIFICATION_TOKEN_TYPE, verifiedAt);

            return {
                status: 'verified',
                userId: user.id,
                alreadyVerified,
            };
        });

        if (verification.status === 'invalid') {
            return sendAuthError(
                res,
                400,
                ERROR_CODES.EMAIL_VERIFICATION_TOKEN_INVALID,
                'Verification token is invalid.'
            );
        }

        if (verification.status === 'expired') {
            return sendAuthError(
                res,
                410,
                ERROR_CODES.EMAIL_VERIFICATION_TOKEN_EXPIRED,
                'Verification token has expired.',
                { canResend: true }
            );
        }

        if (verification.status === 'revoked') {
            return sendAuthError(
                res,
                410,
                ERROR_CODES.EMAIL_VERIFICATION_TOKEN_REVOKED,
                'Verification token is no longer available.',
                { canResend: true }
            );
        }

        const user = await findSafeUserById(verification.userId);
        return res.json({
            verified: true,
            alreadyVerified: Boolean(verification.alreadyVerified),
            ...(user ? {
                user: {
                    id: user.id,
                    email: user.email,
                    emailVerified: true,
                    emailVerifiedAt: user.email_verified_at || null,
                },
            } : {}),
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/resend-verification-email', requireAuth, async (req, res, next) => {
    try {
        const user = await findSafeUserById(req.session.userId);
        if (!user || user.account_status !== 'active') {
            return sendAuthError(
                res,
                401,
                ERROR_CODES.AUTH_REQUIRED,
                'Authentication required.'
            );
        }

        if (user.email_verified_at) {
            return res.json({
                sent: false,
                alreadyVerified: true,
            });
        }

        const cooldown = await emailVerificationTokenService.getEmailVerificationResendCooldown(user.id);
        if (cooldown.active) {
            res.set('Retry-After', String(cooldown.remainingSeconds));
            return sendAuthError(
                res,
                429,
                ERROR_CODES.EMAIL_VERIFICATION_RESEND_COOLDOWN,
                'Please wait before requesting another verification email.',
                { retryAfterSeconds: cooldown.remainingSeconds }
            );
        }

        const sendResult = await issueAndSendVerificationEmail(user, req);
        return res.json({
            sent: Boolean(sendResult.emailSent),
            cooldownSeconds: DEFAULT_RESEND_COOLDOWN_SECONDS,
            expiresInSeconds: DEFAULT_EXPIRY_HOURS * 60 * 60,
            emailTransportDisabled: Boolean(sendResult.emailTransportDisabled),
            emailSendFailed: Boolean(sendResult.failed),
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/logout', async (req, res, next) => {
    try {
        await destroySession(req);
        res.clearCookie(sessionName, {
            httpOnly: true,
            sameSite: sessionCookieSameSite,
            secure: sessionCookieSecure,
        });
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

function normalizeSameSite(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['lax', 'strict', 'none'].includes(normalized)) {
        return normalized;
    }
    return isProduction ? 'none' : 'lax';
}

app.use((error, _req, res, _next) => {
    console.error('Server error:', error.code || error.message);
    if (error.status && error.status < 600 && error.code) {
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
