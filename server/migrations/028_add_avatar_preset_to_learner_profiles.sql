ALTER TABLE learner_profiles
  ADD COLUMN avatar_preset VARCHAR(32) NULL DEFAULT NULL AFTER learning_style;
