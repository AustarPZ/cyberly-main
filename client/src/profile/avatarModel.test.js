import {
  AVATAR_PRESET_IDS,
  getInitialAvatarText,
  normalizeAvatarPreset,
  resolveAvatarModel,
} from "./avatarModel";

const expectedPresetIds = [
  "explorer_orbit",
  "explorer_peak",
  "explorer_compass",
  "explorer_spark",
  "explorer_wave",
  "explorer_horizon",
];

describe("frontend avatar model", () => {
  test("exposes exactly the six approved preset IDs", () => {
    expect(AVATAR_PRESET_IDS).toEqual(expectedPresetIds);
  });

  test.each(expectedPresetIds)("normalizes the approved preset %s", presetId => {
    expect(normalizeAvatarPreset(presetId)).toBe(presetId);
  });

  test.each([
    undefined,
    null,
    "",
    " explorer_orbit ",
    "EXPLORER_ORBIT",
    "initials",
    "https://example.test/avatar.png",
    "data:image/svg+xml;base64,unsafe",
    1,
    {},
  ])("normalizes an unsupported value to null", value => {
    expect(normalizeAvatarPreset(value)).toBeNull();
  });

  test.each([
    [" Alice ", "A"],
    ["陈小明", "陈"],
    ["étoile", "É"],
    ["", "C"],
    ["   ", "C"],
    [null, "C"],
    [undefined, "C"],
  ])("creates canonical initials for %p", (displayName, expected) => {
    expect(getInitialAvatarText(displayName)).toBe(expected);
  });

  test("resolves valid presets and safely falls back to initials", () => {
    expect(resolveAvatarModel({ avatarPreset: "explorer_wave", displayName: "Alya" })).toEqual({
      type: "preset",
      presetId: "explorer_wave",
    });
    expect(resolveAvatarModel({ avatarPreset: "javascript:alert(1)", displayName: " Chen " })).toEqual({
      type: "initials",
      text: "C",
    });
  });
});
