const { normalizeLocale } = require('../i18n/locale');
const { buildResourceChunks } = require('./rag.chunker');

const DEFAULT_RETRIEVAL_LIMIT = 4;

function validateQuery(query) {
  const text = String(query || '').trim();
  if (!text) throw new Error('RAG query is required.');
  return text;
}

function createRagService(repository) {
  async function ingestPublishedResources() {
    return repository.withTransaction(async (connection) => {
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

  async function retrieveForLocale({ query, locale, topicCode, categoryCode, limit }) {
    return repository.searchChunks({
      query,
      locale,
      topicCode,
      categoryCode,
      limit,
    });
  }

  async function retrieveReviewedChunks(input = {}) {
    const query = validateQuery(input.query);
    const locale = normalizeLocale(input.locale);
    const limit = Number.isInteger(Number(input.limit))
      ? Math.min(Math.max(Number(input.limit), 1), 8)
      : DEFAULT_RETRIEVAL_LIMIT;

    const primary = await retrieveForLocale({
      query,
      locale,
      topicCode: input.topicCode || null,
      categoryCode: input.categoryCode || null,
      limit,
    });

    if (locale === 'en' || primary.length >= limit) {
      return primary.slice(0, limit);
    }

    const fallback = await retrieveForLocale({
      query,
      locale: 'en',
      topicCode: input.topicCode || null,
      categoryCode: input.categoryCode || null,
      limit: limit - primary.length,
    });
    const seen = new Set(primary.map(item => item.chunkId));
    const merged = [...primary];
    for (const item of fallback) {
      if (seen.has(item.chunkId)) continue;
      seen.add(item.chunkId);
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return merged;
  }

  return {
    ingestPublishedResources,
    retrieveReviewedChunks,
  };
}

module.exports = {
  createRagService,
};
