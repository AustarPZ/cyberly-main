const express = require('express');
const { createRequireAdmin } = require('./admin.middleware');

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

function createAdminRouter(pool) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(pool);

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

  return router;
}

module.exports = {
  ADMIN_MODULES,
  createAdminRouter,
};
