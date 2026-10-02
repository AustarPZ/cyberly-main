-- STG-RES-SRC-RF01: five verified citation repairs, NOT body/source acceptance.
-- NIGHT-RUN-01 qualified NIST AI 100-4 on 2026-09-30 after failed CISA
-- candidates. All article bodies retain their separate evidence-review gate.
-- Execute only through migration-runner's transaction, after DB authorization.
-- Temporary DDL does not implicitly commit. A duplicate guard key raises an
-- error before any resource UPDATE, causing the runner to roll back.
-- Old/new source tuples are the only accepted states. Customized sources,
-- missing target rows or missing/changed supported-locale labels require review.

CREATE TEMPORARY TABLE rf01_source_map (
  slug VARCHAR(140) PRIMARY KEY,
  old_url VARCHAR(500) NOT NULL,
  new_url VARCHAR(500) NOT NULL,
  old_label VARCHAR(180) NOT NULL,
  new_label VARCHAR(180) NOT NULL,
  old_type VARCHAR(80) NOT NULL,
  new_type VARCHAR(80) NOT NULL,
  old_country VARCHAR(80) NOT NULL,
  new_country VARCHAR(80) NOT NULL,
  old_authority VARCHAR(80) NOT NULL,
  new_authority VARCHAR(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO rf01_source_map VALUES
('phishing',
 'https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-awareness/resources/phishing',
 'https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-campaigns/the-unseen-enemy-campaign/beware-of-phishing-scams/',
 'Cyber Security Agency of Singapore',
 'Cyber Security Agency of Singapore (CSA) — Beware of Phishing Scams',
 'government_cybersecurity_agency', 'government_cybersecurity_agency',
 'SG', 'SG', 'official_agency', 'official_agency'),
('online-scams',
 'https://www.nsrc.my/',
 'https://www.malaysia.gov.my/en/categories/safety-community-and-law--order/cybersecurity/nsrc-997-hotline',
 'National Scam Response Centre (NSRC) Malaysia',
 'Government of Malaysia — NSRC 997 Hotline',
 'government_response_center', 'official_portal',
 'MY', 'MY', 'official_national_response', 'official_portal'),
('ai-generated-content',
 'https://www.mcmc.gov.my/en/media/press-clippings/understanding-ai-generated-content',
 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-4.pdf',
 'Malaysian Communications and Multimedia Commission (MCMC)',
 'NIST — Reducing Risks Posed by Synthetic Content',
 'government_regulator_page', 'official_portal',
 'MY', 'US', 'official_press_or_media_page', 'official_agency'),
('deepfakes',
 'https://www.interpol.int/en/Crimes/Cybercrime/Deepfakes',
 'https://www.interpol.int/en/How-we-work/Innovation/Projects/Project-SynthWave',
 'INTERPOL — Deepfakes Resource',
 'INTERPOL — Project SynthWave',
 'international_law_enforcement', 'international_law_enforcement',
 'global', 'global', 'recognised_international', 'recognised_international'),
('cyberbullying',
 'https://www.unicef.org/malaysia/what-is-cyberbullying',
 'https://www.unicef.org/stories/how-to-stop-cyberbullying',
 'UNICEF Malaysia — Cyberbullying Resources',
 'UNICEF — Cyberbullying: What is it and how to stop it',
 'ngo_child_safety', 'recognised_ngo',
 'MY', 'global', 'recognised_ngo', 'recognised_ngo');

SELECT r.id FROM resource_articles r
JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
ORDER BY r.id FOR UPDATE;

SELECT t.resource_id, t.locale FROM resource_article_translations t
JOIN resource_articles r ON r.id = t.resource_id
JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
ORDER BY t.resource_id, t.locale FOR UPDATE;

CREATE TEMPORARY TABLE rf01_assert (id INT PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO rf01_assert VALUES (1);

-- Duplicate key means target source identity drift/missing target: STOP.
INSERT INTO rf01_assert SELECT 1 WHERE (
  SELECT COUNT(*) FROM resource_articles r
  JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
  WHERE (
    BINARY r.source_url = BINARY m.old_url
    AND BINARY r.source_type = BINARY m.old_type
    AND BINARY r.source_country = BINARY m.old_country
    AND BINARY r.source_authority_level = BINARY m.old_authority
  ) OR (
    BINARY r.source_url = BINARY m.new_url
    AND BINARY r.source_type = BINARY m.new_type
    AND BINARY r.source_country = BINARY m.new_country
    AND BINARY r.source_authority_level = BINARY m.new_authority
  )
) <> 5;

-- Fifteen existing translations required, with exact old or repaired labels.
-- Other locale rows are neither created, removed nor rewritten.
INSERT INTO rf01_assert SELECT 1 WHERE (
  SELECT COUNT(*) FROM resource_article_translations t
  JOIN resource_articles r ON r.id = t.resource_id
  JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
  WHERE t.locale IN ('en', 'ms', 'zh-CN')
    AND BINARY t.source_label IN (BINARY m.old_label, BINARY m.new_label)
) <> 15;

-- Parent revision changes when metadata OR a supported source label changes.
-- Follow existing admin metadata timestamp semantics, without approving content.
UPDATE resource_articles r
JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
SET r.source_url = m.new_url,
    r.source_type = m.new_type,
    r.source_country = m.new_country,
    r.source_authority_level = m.new_authority,
    r.updated_at = CURRENT_TIMESTAMP
WHERE NOT (
  BINARY r.source_url = BINARY m.new_url
  AND BINARY r.source_type = BINARY m.new_type
  AND BINARY r.source_country = BINARY m.new_country
  AND BINARY r.source_authority_level = BINARY m.new_authority
) OR EXISTS (
  SELECT 1 FROM resource_article_translations t
  WHERE t.resource_id = r.id AND t.locale IN ('en', 'ms', 'zh-CN')
    AND BINARY t.source_label <> BINARY m.new_label
);

UPDATE resource_article_translations t
JOIN resource_articles r ON r.id = t.resource_id
JOIN rf01_source_map m ON BINARY r.slug = BINARY m.slug
SET t.source_label = m.new_label,
    t.updated_at = CURRENT_TIMESTAMP(3)
WHERE t.locale IN ('en', 'ms', 'zh-CN')
  AND BINARY t.source_label <> BINARY m.new_label;

DROP TEMPORARY TABLE rf01_assert;
DROP TEMPORARY TABLE rf01_source_map;
