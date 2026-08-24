const SUPPORTED_AVATAR_PRESETS = Object.freeze([
  'explorer_orbit',
  'explorer_peak',
  'explorer_compass',
  'explorer_spark',
  'explorer_wave',
  'explorer_horizon',
]);

const SUPPORTED_AVATAR_PRESET_SET = new Set(SUPPORTED_AVATAR_PRESETS);

function isSupportedAvatarPreset(value) {
  return typeof value === 'string' && SUPPORTED_AVATAR_PRESET_SET.has(value);
}

module.exports = {
  SUPPORTED_AVATAR_PRESETS,
  isSupportedAvatarPreset,
};
