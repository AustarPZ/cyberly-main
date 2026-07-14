const express = require('express');
const { createRequireAdmin } = require('./admin.middleware');
const { createRagRepository } = require('../rag/rag.repository');
const { createRagService } = require('../rag/rag.service');
const {
  PUBLICATION_STATUSES,
  REVIEW_STATUSES,
  evaluateResourceRagEligibility,
  normalizeNextReviewAt,
} = require('../resource/resource.governance');
const {
  buildTranslationsMap,
  fetchContentResource,
  fetchContentTranslations,
  mapResourceForContent,
  mapTranslation,
  saveContentTranslation,
  validateContentPayload,
} = require('./admin.resourceContent');

const ADMIN_MODULES = [
  'dashboard',
  'resources',
  'rag',
  'aiSafety',
  'contentRelationships',
  'malaysiaGuidance',
];

const RESOURCE_CATEGORY_LABELS = {
  Beginner: 'Beginner / Digital Foundations',
  Scams: 'Scams & Social Engineering',
  Passwords: 'Passwords & Account Security',
  Privacy: 'Privacy & Personal Data Protection',
  Safety: 'Online Safety & Digital Wellbeing',
  Misinformation: 'Misinformation & Media Literacy',
  'AI & Technology': 'AI & Technology Safety',
};

function toBoolean(value) {
  return Number(value || 0) === 1;
}

function mapResourceReviewRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    categoryCode: row.category_code,
    displayCategory: RESOURCE_CATEGORY_LABELS[row.category_code] || row.category_code,
    status: row.status,
    reviewStatus: row.review_status,
    ragReady: toBoolean(row.rag_ready),
    ragReadyReason: row.rag_ready_reason,
    sourceLabel: row.source_label,
    sourceOrganisation: row.source_label,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    sourceCountry: row.source_country,
    sourceAuthorityLevel: row.source_authority_level,
    lastSourceCheckedAt: row.last_source_checked_at,
    reviewedAt: row.reviewed_at,
    nextReviewAt: row.next_review_at,
    malaysiaGuidanceFlag: toBoolean(row.malaysia_guidance_flag),
    sensitiveTopicFlag: toBoolean(row.sensitive_topic_flag),
    replacementSourceNeeded: toBoolean(row.replacement_source_needed),
    ageAppropriateness: row.age_appropriateness,
    reviewNotes: row.review_notes,
    translationCount: Number(row.translation_count || 0),
  };
}

function buildResourceReviewSummary(resources) {
  return {
    totalResources: resources.length,
    needsReviewCount: resources.filter(resource => resource.reviewStatus !== 'approved').length,
    ragReadyCount: resources.filter(resource => resource.ragReady).length,
    replacementSourceNeededCount: resources.filter(resource => resource.replacementSourceNeeded).length,
    malaysiaGuidanceFlaggedCount: resources.filter(resource => resource.malaysiaGuidanceFlag).length,
  };
}

const ALLOWED_GOVERNANCE_FIELDS = new Set([
  'publicationStatus',
  'reviewStatus',
  'ragReady',
  'reviewNotes',
  'nextReviewAt',
]);

function httpError(status, code, message, extra = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  Object.assign(error, extra);
  return error;
}

function parsePositiveInteger(value, fallback, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function normalizeNullableText(value, maxLength = 5000) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim().slice(0, maxLength) || null;
}

function parseBooleanInput(value) {
  if (value === undefined) return undefined;
  if (value === true || value === false) return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return Symbol.for('invalid_boolean');
}

function mapEligibility(row) {
  return evaluateResourceRagEligibility({
    status: row.status,
    review_status: row.review_status,
    rag_ready: row.rag_ready,
  });
}

function mapResourceListRow(row) {
  const eligibility = mapEligibility(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || row.slug,
    locale: row.locale || 'en',
    category: row.category_code,
    categoryCode: row.category_code,
    displayCategory: RESOURCE_CATEGORY_LABELS[row.category_code] || row.category_code,
    topic: row.category_code,
    publicationStatus: row.status,
    reviewStatus: row.review_status,
    ragReady: toBoolean(row.rag_ready),
    effectiveRagEligible: eligibility.effectiveRagEligible,
    effectiveRagReasons: eligibility.reasons,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    nextReviewAt: row.next_review_at,
    sourceType: row.source_type,
    sourceCountry: row.source_country,
    sourceAuthorityLevel: row.source_authority_level,
    ageAppropriateness: row.age_appropriateness,
    sensitiveTopicFlag: toBoolean(row.sensitive_topic_flag),
    malaysiaGuidanceFlag: toBoolean(row.malaysia_guidance_flag),
    replacementSourceNeeded: toBoolean(row.replacement_source_needed),
    updatedAt: row.updated_at,
  };
}

function mapRagDocument(row) {
  return {
    id: row.id,
    locale: row.locale,
    title: row.title,
    status: row.status,
    reviewStatus: row.review_status,
    ragReady: toBoolean(row.rag_ready),
    chunkCount: Number(row.chunk_count || 0),
    retrievableChunkCount: Number(row.retrievable_chunk_count || 0),
    updatedAt: row.updated_at,
  };
}

function mapResourceDetail(row, translations, ragDocuments, retrievableChunkCount) {
  const eligibility = mapEligibility(row);
  const english = translations.find(item => item.locale === 'en') || translations[0] || {};
  return {
    ...mapResourceListRow({
      ...row,
      title: english.title,
      locale: english.locale || 'en',
    }),
    summary: english.summary || '',
    sourceLabel: english.source_label || null,
    sourceUrl: row.source_url,
    ragReadyReason: row.rag_ready_reason,
    reviewNotes: row.review_notes,
    lastSourceCheckedAt: row.last_source_checked_at,
    translations: translations.map(translation => ({
      locale: translation.locale,
      title: translation.title,
      summary: translation.summary,
      sourceLabel: translation.source_label,
    })),
    ragDocuments: ragDocuments.map(mapRagDocument),
    retrievableChunkCount,
    effectiveRagEligible: eligibility.effectiveRagEligible,
    effectiveRagReasons: eligibility.reasons,
  };
}

function buildAdminResourceSummary(rows) {
  return {
    total: rows.length,
    published: rows.filter(row => row.status === 'published').length,
    draft: rows.filter(row => row.status === 'draft').length,
    archived: rows.filter(row => row.status === 'archived').length,
    approved: rows.filter(row => row.review_status === 'approved').length,
    needsReview: rows.filter(row => row.review_status !== 'approved').length,
    rejected: rows.filter(row => row.review_status === 'rejected').length,
    ragReady: rows.filter(row => toBoolean(row.rag_ready)).length,
    effectivelyRagEligible: rows.filter(row => mapEligibility(row).effectiveRagEligible).length,
  };
}

async function fetchResourceBase(poolOrConnection, resourceId, lock = false) {
  const [rows] = await poolOrConnection.query(
    `SELECT *
     FROM resource_articles
     WHERE id = ?
     ${lock ? 'FOR UPDATE' : ''}`,
    [resourceId]
  );
  return rows[0] || null;
}

async function fetchResourceTranslations(poolOrConnection, resourceId) {
  const [rows] = await poolOrConnection.query(
    `SELECT locale, title, summary, source_label
     FROM resource_article_translations
     WHERE resource_id = ?
     ORDER BY FIELD(locale, 'en', 'ms', 'zh-CN'), locale`,
    [resourceId]
  );
  return rows;
}

function createAdminRouter(pool) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(pool);
  const ragRepository = createRagRepository(pool);
  const ragService = createRagService(ragRepository);

  router.get('/status', requireAdmin, (_req, res) => {
    res.json({
      ok: true,
      role: 'admin',
      modules: ADMIN_MODULES,
      message: 'Admin access verified',
    });
  });

  router.get('/resources/review', requireAdmin, async (_req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT ra.id,
                ra.slug,
                ra.category_code,
                ra.status,
                ra.review_status,
                ra.rag_ready,
                ra.rag_ready_reason,
                ra.source_url,
                ra.source_type,
                ra.source_country,
                ra.source_authority_level,
                ra.last_source_checked_at,
                ra.reviewed_at,
                ra.next_review_at,
                ra.malaysia_guidance_flag,
                ra.sensitive_topic_flag,
                ra.replacement_source_needed,
                ra.age_appropriateness,
                ra.review_notes,
                MAX(CASE WHEN rat.locale = 'en' THEN rat.source_label ELSE NULL END) AS source_label,
                COUNT(DISTINCT rat.locale) AS translation_count
         FROM resource_articles ra
         LEFT JOIN resource_article_translations rat ON rat.resource_id = ra.id
         GROUP BY ra.id,
                  ra.slug,
                  ra.category_code,
                  ra.status,
                  ra.review_status,
                  ra.rag_ready,
                  ra.rag_ready_reason,
                  ra.source_url,
                  ra.source_type,
                  ra.source_country,
                  ra.source_authority_level,
                  ra.last_source_checked_at,
                  ra.reviewed_at,
                  ra.next_review_at,
                  ra.malaysia_guidance_flag,
                  ra.sensitive_topic_flag,
                  ra.replacement_source_needed,
                  ra.age_appropriateness,
                  ra.review_notes
         ORDER BY ra.display_order, ra.id`
      );
      const resources = rows.map(mapResourceReviewRow);
      res.json({
        summary: buildResourceReviewSummary(resources),
        resources,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/resources', requireAdmin, async (req, res, next) => {
    try {
      const page = parsePositiveInteger(req.query.page, 1, 100000);
      const pageSize = parsePositiveInteger(req.query.pageSize, 20, 50);
      const offset = (page - 1) * pageSize;
      const search = String(req.query.search || '').trim();
      const publicationStatus = String(req.query.publicationStatus || '').trim();
      const reviewStatus = String(req.query.reviewStatus || '').trim();
      const ragReady = parseBooleanInput(req.query.ragReady);

      if (publicationStatus && !PUBLICATION_STATUSES.has(publicationStatus)) {
        throw httpError(400, 'ADMIN_RESOURCE_INVALID_PUBLICATION_STATUS', 'Publication status is invalid.');
      }
      if (reviewStatus && !REVIEW_STATUSES.has(reviewStatus)) {
        throw httpError(400, 'ADMIN_RESOURCE_INVALID_REVIEW_STATUS', 'Review status is invalid.');
      }
      if (ragReady === Symbol.for('invalid_boolean')) {
        throw httpError(400, 'ADMIN_RESOURCE_INVALID_RAG_READY', 'RAG readiness filter is invalid.');
      }

      const where = [];
      const params = [];
      if (search) {
        where.push('(ra.slug LIKE ? OR en.title LIKE ? OR en.summary LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like);
      }
      if (publicationStatus) {
        where.push('ra.status = ?');
        params.push(publicationStatus);
      }
      if (reviewStatus) {
        where.push('ra.review_status = ?');
        params.push(reviewStatus);
      }
      if (ragReady !== undefined) {
        where.push('ra.rag_ready = ?');
        params.push(ragReady ? 1 : 0);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const [allRows] = await pool.query(
        `SELECT ra.id,
                ra.slug,
                ra.category_code,
                ra.status,
                ra.review_status,
                ra.rag_ready
         FROM resource_articles ra`
      );

      const [[countRow]] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM resource_articles ra
         LEFT JOIN resource_article_translations en ON en.resource_id = ra.id AND en.locale = 'en'
         ${whereSql}`,
        params
      );

      const [rows] = await pool.query(
        `SELECT ra.id,
                ra.slug,
                ra.category_code,
                ra.status,
                ra.review_status,
                ra.rag_ready,
                ra.reviewed_at,
                ra.reviewed_by,
                ra.next_review_at,
                ra.source_type,
                ra.source_country,
                ra.source_authority_level,
                ra.age_appropriateness,
                ra.sensitive_topic_flag,
                ra.malaysia_guidance_flag,
                ra.replacement_source_needed,
                ra.updated_at,
                en.locale,
                en.title
         FROM resource_articles ra
         LEFT JOIN resource_article_translations en ON en.resource_id = ra.id AND en.locale = 'en'
         ${whereSql}
         ORDER BY ra.display_order, ra.id
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      const totalItems = Number(countRow?.count || 0);
      res.json({
        items: rows.map(mapResourceListRow),
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        },
        summary: buildAdminResourceSummary(allRows),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/resources/:resourceId', requireAdmin, async (req, res, next) => {
    try {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isInteger(resourceId) || resourceId < 1) {
        throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      }
      const resource = await fetchResourceBase(pool, resourceId);
      if (!resource) throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      const translations = await fetchResourceTranslations(pool, resourceId);
      const ragDocuments = await ragRepository.listDocumentsForResource(resourceId);
      const retrievableChunkCount = await ragRepository.countRetrievableChunksForResource(resourceId);
      res.json({
        resource: mapResourceDetail(resource, translations, ragDocuments, retrievableChunkCount),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/resources/:resourceId/content', requireAdmin, async (req, res, next) => {
    try {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isInteger(resourceId) || resourceId < 1) {
        throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      }
      const resource = await fetchContentResource(pool, resourceId);
      if (!resource) throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      const translations = await fetchContentTranslations(pool, resourceId);
      res.json({
        resource: mapResourceForContent(resource),
        translations: buildTranslationsMap(translations),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/resources/:resourceId/content', requireAdmin, async (req, res, next) => {
    const connection = await pool.getConnection();
    let savedResource = null;
    let savedTranslation = null;
    let payload = null;
    try {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isInteger(resourceId) || resourceId < 1) {
        throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      }
      payload = validateContentPayload(req.body || {});

      await connection.beginTransaction();
      const current = await fetchContentResource(connection, resourceId, true);
      if (!current) throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      savedTranslation = await saveContentTranslation(connection, resourceId, payload);
      savedResource = await fetchContentResource(connection, resourceId);
      await connection.commit();
    } catch (error) {
      try {
        await connection.rollback();
      } catch {}
      return next(error);
    } finally {
      connection.release();
    }

    const resource = mapResourceForContent(savedResource);
    const ragSync = {
      attempted: false,
      succeeded: false,
      reason: 'resource_not_rag_eligible',
    };

    if (resource.effectiveRagEligible) {
      ragSync.attempted = true;
      try {
        const syncResult = await ragService.syncResourceTranslation(resource.id, payload.locale);
        ragSync.succeeded = Boolean(syncResult.effectiveRagEligible);
        ragSync.reason = syncResult.effectiveRagEligible
          ? 'eligible_resource_translation_updated'
          : (syncResult.reasons?.[0] || 'resource_not_rag_eligible');
        ragSync.documents = syncResult.documents;
        ragSync.chunks = syncResult.chunks;
      } catch {
        ragSync.succeeded = false;
        ragSync.reason = 'rag_sync_failed';
      }
    }

    res.json({
      ok: true,
      resource,
      translation: mapTranslation(savedTranslation),
      ragSync,
    });
  });

  router.patch('/resources/:resourceId/governance', requireAdmin, async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
      const resourceId = Number(req.params.resourceId);
      if (!Number.isInteger(resourceId) || resourceId < 1) {
        throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');
      }

      const body = req.body || {};
      const unknownFields = Object.keys(body).filter(field => !ALLOWED_GOVERNANCE_FIELDS.has(field));
      if (unknownFields.length) {
        throw httpError(400, 'ADMIN_RESOURCE_UNKNOWN_FIELDS', 'Unknown governance fields are not allowed.', {
          errors: { fields: unknownFields },
        });
      }

      const normalized = {};
      if (body.publicationStatus !== undefined) {
        normalized.publicationStatus = String(body.publicationStatus).trim();
        if (!PUBLICATION_STATUSES.has(normalized.publicationStatus)) {
          throw httpError(400, 'ADMIN_RESOURCE_INVALID_PUBLICATION_STATUS', 'Publication status is invalid.');
        }
      }
      if (body.reviewStatus !== undefined) {
        normalized.reviewStatus = String(body.reviewStatus).trim();
        if (!REVIEW_STATUSES.has(normalized.reviewStatus)) {
          throw httpError(400, 'ADMIN_RESOURCE_INVALID_REVIEW_STATUS', 'Review status is invalid.');
        }
      }
      if (body.ragReady !== undefined) {
        normalized.ragReady = parseBooleanInput(body.ragReady);
        if (normalized.ragReady === Symbol.for('invalid_boolean')) {
          throw httpError(400, 'ADMIN_RESOURCE_INVALID_RAG_READY', 'RAG readiness value is invalid.');
        }
      }
      if (body.reviewNotes !== undefined) normalized.reviewNotes = normalizeNullableText(body.reviewNotes);
      if (body.nextReviewAt !== undefined) {
        normalized.nextReviewAt = normalizeNextReviewAt(body.nextReviewAt);
        if (normalized.nextReviewAt === Symbol.for('invalid_date')) {
          throw httpError(400, 'ADMIN_RESOURCE_INVALID_NEXT_REVIEW_AT', 'Next review date is invalid.');
        }
      }

      await connection.beginTransaction();
      const current = await fetchResourceBase(connection, resourceId, true);
      if (!current) throw httpError(404, 'ADMIN_RESOURCE_NOT_FOUND', 'Resource was not found.');

      const nextState = {
        status: normalized.publicationStatus || current.status,
        review_status: normalized.reviewStatus || current.review_status,
        rag_ready: normalized.ragReady === undefined ? toBoolean(current.rag_ready) : normalized.ragReady,
      };
      const automaticChanges = [];
      if ((nextState.status !== 'published' || nextState.review_status !== 'approved') && nextState.rag_ready) {
        nextState.rag_ready = false;
        automaticChanges.push('rag_ready_disabled');
      }

      const updateColumns = [
        'status = ?',
        'review_status = ?',
        'rag_ready = ?',
        'updated_at = CURRENT_TIMESTAMP',
      ];
      const updateParams = [
        nextState.status,
        nextState.review_status,
        nextState.rag_ready ? 1 : 0,
      ];

      if (normalized.reviewStatus !== undefined) {
        updateColumns.push('reviewed_by = ?', 'reviewed_at = CURRENT_TIMESTAMP');
        updateParams.push(req.adminUser.id);
      }
      if (normalized.reviewNotes !== undefined) {
        updateColumns.push('review_notes = ?');
        updateParams.push(normalized.reviewNotes);
      }
      if (normalized.nextReviewAt !== undefined) {
        updateColumns.push('next_review_at = ?');
        updateParams.push(normalized.nextReviewAt);
      }

      updateParams.push(resourceId);
      await connection.query(
        `UPDATE resource_articles
         SET ${updateColumns.join(', ')}
         WHERE id = ?`,
        updateParams
      );

      await ragService.syncResource(resourceId, connection);
      const saved = await fetchResourceBase(connection, resourceId);
      const translations = await fetchResourceTranslations(connection, resourceId);
      const ragDocuments = await ragRepository.listDocumentsForResource(resourceId, connection);
      const retrievableChunkCount = await ragRepository.countRetrievableChunksForResource(resourceId, connection);
      await connection.commit();

      res.json({
        ok: true,
        automaticChanges,
        resource: mapResourceDetail(saved, translations, ragDocuments, retrievableChunkCount),
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {}
      next(error);
    } finally {
      connection.release();
    }
  });

  return router;
}

module.exports = {
  ADMIN_MODULES,
  createAdminRouter,
};
