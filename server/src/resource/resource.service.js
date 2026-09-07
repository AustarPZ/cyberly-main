const { normalizeLocale } = require('../i18n/locale');
const { ERROR_CODES } = require('../errors/errorCodes');
const { mapResource } = require('./resource.mapper');
const { getRelatedScenarioSlug } = require('./resourceScenarioRegistry');

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function normalizeSlug(value) {
  return String(value || '').trim().toLowerCase();
}

function createResourceService(repository, scenarioRepository) {
  async function listResources(localeInput) {
    const locale = normalizeLocale(localeInput);
    const rows = await repository.listPublishedResources(locale);
    return { resources: rows.map(mapResource) };
  }

  async function getResource(slug, localeInput) {
    const locale = normalizeLocale(localeInput);
    const resource = await repository.findPublishedBySlug(normalizeSlug(slug), locale);
    if (!resource) throw httpError(404, ERROR_CODES.RESOURCE_NOT_FOUND, 'Resource was not found.');
    const mappedResource = mapResource(resource);
    const targetSlug = getRelatedScenarioSlug(mappedResource.slug);
    let relatedScenario = null;
    if (targetSlug) {
      if (typeof scenarioRepository?.findPublishedBySlug !== 'function') {
        throw new TypeError('Scenario repository must provide findPublishedBySlug for mapped Resources.');
      }
      const target = await scenarioRepository.findPublishedBySlug(targetSlug);
      if (target) relatedScenario = { slug: target.slug };
    }
    return { resource: { ...mappedResource, relatedScenario } };
  }

  return {
    getResource,
    listResources,
  };
}

module.exports = {
  createResourceService,
};
