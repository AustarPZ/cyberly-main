const { normalizeLocale } = require('../i18n/locale');
const { buildResourceChunks } = require('./rag.chunker');
const { createRagQueryIntent, enrichRagQuery } = require('./ragQueryIntent');
const { evaluateResourceRagEligibility } = require('../resource/resource.governance');

const DEFAULT_RETRIEVAL_LIMIT = 4;

function validateQuery(query) {
  const text = String(query || '').trim();
  if (!text) throw new Error('RAG query is required.');
  return text;
}

function resourceKey(item) {
  return item?.resourceSlug ||
    item?.internalTarget?.resourceSlug ||
    (item?.documentId ? `document:${item.documentId}` : null) ||
    item?.sourceUrl ||
    (item?.title ? `title:${String(item.title).trim().toLowerCase()}` : null);
}

function isPreferredResource(item, intent) {
  const slugs = new Set(intent?.preferredResourceSlugs || []);
  const slug = item?.resourceSlug || item?.internalTarget?.resourceSlug;
  return Boolean(slug && slugs.has(slug));
}

function passesRelevanceGuard(item, intent) {
  if (!item) return false;
  if (intent?.intent !== 'phishing_and_scams') return true;
  if (item.categoryCode !== 'Scams') return false;
  if (isPreferredResource(item, intent)) return Number(item.score || 0) >= 1;
  return Number(item.score || 0) >= Number(intent.minimumScore || 0);
}

function dedupeResources(items, intent, limit) {
  const orderedItems = intent?.intent === 'phishing_and_scams'
    ? [...items].sort((left, right) => {
      const preferred = intent.preferredResourceSlugs || [];
      const leftSlug = left?.resourceSlug || left?.internalTarget?.resourceSlug;
      const rightSlug = right?.resourceSlug || right?.internalTarget?.resourceSlug;
      const leftIndex = preferred.includes(leftSlug) ? preferred.indexOf(leftSlug) : preferred.length;
      const rightIndex = preferred.includes(rightSlug) ? preferred.indexOf(rightSlug) : preferred.length;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return Number(right?.score || 0) - Number(left?.score || 0);
    })
    : items;
  const seen = new Set();
  const deduped = [];
  for (const item of orderedItems) {
    if (!passesRelevanceGuard(item, intent)) continue;
    const key = resourceKey(item);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    deduped.push(item);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

function mergeLocaleResults(primary, fallback, intent, limit) {
  const seen = new Set(primary.map(resourceKey).filter(Boolean));
  const merged = [...primary];
  for (const item of dedupeResources(fallback, intent, limit)) {
    const key = resourceKey(item);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

function createRagService(repository) {
  async function ingestPublishedResources() {
    return repository.withTransaction(async (connection) => {
      const resourceStates = await repository.listResourceGovernanceStates(connection);
      for (const resource of resourceStates) {
        await repository.updateResourceDocumentGovernance(resource.resource_id, resource, connection);
      }

      const resources = await repository.listPublishedResourceTranslations(connection);
      let chunkTotal = 0;
      for (const resource of resources) {
        const document = await repository.upsertResourceDocument(resource, connection);
        if (!document) continue;
        const chunks = buildResourceChunks(resource);
        await repository.replaceChunks(document.id, chunks, connection);
        chunkTotal += chunks.length;
      }
      return {
        documents: await repository.countDocuments(connection),
        chunks: chunkTotal,
      };
    });
  }

  async function syncResource(resourceId, connection) {
    const run = async (activeConnection) => {
      const resources = await repository.listResourceTranslationsById(resourceId, activeConnection);
      if (!resources.length) {
        return {
          found: false,
          effectiveRagEligible: false,
          reasons: ['resource_not_found'],
          documents: 0,
          chunks: 0,
        };
      }

      const resourceState = resources[0];
      const eligibility = evaluateResourceRagEligibility({
        status: resourceState.status,
        review_status: resourceState.review_status,
        rag_ready: resourceState.rag_ready,
      });

      await repository.updateResourceDocumentGovernance(resourceId, resourceState, activeConnection);
      if (!eligibility.effectiveRagEligible) {
        return {
          found: true,
          effectiveRagEligible: false,
          reasons: eligibility.reasons,
          documents: resources.length,
          chunks: await repository.countRetrievableChunksForResource(resourceId, activeConnection),
        };
      }

      let chunkTotal = 0;
      for (const resource of resources) {
        const document = await repository.upsertResourceDocument(resource, activeConnection);
        if (!document) continue;
        const chunks = buildResourceChunks(resource);
        await repository.replaceChunks(document.id, chunks, activeConnection);
        chunkTotal += chunks.length;
      }

      return {
        found: true,
        effectiveRagEligible: true,
        reasons: [],
        documents: resources.length,
        chunks: chunkTotal,
      };
    };

    if (connection) return run(connection);
    return repository.withTransaction(run);
  }

  async function syncResourceTranslation(resourceId, locale, connection) {
    const run = async (activeConnection) => {
      const resource = await repository.findResourceTranslationByIdAndLocale(resourceId, locale, activeConnection);
      if (!resource) {
        return {
          found: false,
          effectiveRagEligible: false,
          reasons: ['resource_translation_not_found'],
          documents: 0,
          chunks: 0,
        };
      }

      const eligibility = evaluateResourceRagEligibility({
        status: resource.status,
        review_status: resource.review_status,
        rag_ready: resource.rag_ready,
      });

      await repository.updateResourceDocumentGovernanceForLocale(resourceId, locale, resource, activeConnection);
      if (!eligibility.effectiveRagEligible) {
        return {
          found: true,
          effectiveRagEligible: false,
          reasons: eligibility.reasons,
          documents: 0,
          chunks: 0,
        };
      }

      const document = await repository.upsertResourceDocument(resource, activeConnection);
      if (!document) {
        return {
          found: true,
          effectiveRagEligible: true,
          reasons: [],
          documents: 0,
          chunks: 0,
        };
      }
      const chunks = buildResourceChunks(resource);
      await repository.replaceChunks(document.id, chunks, activeConnection);
      return {
        found: true,
        effectiveRagEligible: true,
        reasons: [],
        documents: 1,
        chunks: chunks.length,
      };
    };

    if (connection) return run(connection);
    return repository.withTransaction(run);
  }

  async function retrieveForLocale({ query, locale, topicCode, categoryCode, categoryCodes, limit }) {
    return repository.searchChunks({
      query,
      locale,
      topicCode,
      categoryCode,
      categoryCodes,
      limit,
    });
  }

  async function retrieveReviewedChunks(input = {}) {
    const query = validateQuery(input.query);
    const locale = normalizeLocale(input.locale);
    const limit = Number.isInteger(Number(input.limit))
      ? Math.min(Math.max(Number(input.limit), 1), 8)
      : DEFAULT_RETRIEVAL_LIMIT;
    const intent = input.intent || createRagQueryIntent(query);
    const retrievalQuery = input.retrievalQuery || enrichRagQuery(query, intent);
    const candidateLimit = Math.min(Math.max(limit * 4, limit), 8);
    const categoryCodes = Array.isArray(input.categoryCodes) && input.categoryCodes.length
      ? input.categoryCodes
      : intent.categoryCodes || [];

    const primary = await retrieveForLocale({
      query: retrievalQuery,
      locale,
      topicCode: input.topicCode || null,
      categoryCode: input.categoryCode || null,
      categoryCodes,
      limit: candidateLimit,
    });
    const primaryDeduped = dedupeResources(primary, intent, limit);

    if (locale === 'en' || !intent.allowEnglishFallback || primaryDeduped.length >= limit) {
      return primaryDeduped.slice(0, limit);
    }

    const fallback = await retrieveForLocale({
      query: retrievalQuery,
      locale: 'en',
      topicCode: input.topicCode || null,
      categoryCode: input.categoryCode || null,
      categoryCodes,
      limit: candidateLimit,
    });
    return mergeLocaleResults(primaryDeduped, fallback, intent, limit);
  }

  return {
    ingestPublishedResources,
    retrieveReviewedChunks,
    syncResource,
    syncResourceTranslation,
  };
}

module.exports = {
  createRagService,
};
