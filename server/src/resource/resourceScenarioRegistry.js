const RESOURCE_SCENARIO_SLUGS = Object.freeze({
  phishing: 'suspicious-parcel-delivery-sms',
});

function getRelatedScenarioSlug(resourceSlug) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_SCENARIO_SLUGS, resourceSlug)
    ? RESOURCE_SCENARIO_SLUGS[resourceSlug]
    : null;
}

module.exports = { getRelatedScenarioSlug };
