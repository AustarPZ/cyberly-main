import React from "react";
import { normalizeLearningPathProgress, buildLearningPathSegments, formatLearningPathPoints } from "./progressSemantics";

function learningPathSegmentLabelKey(segmentId) {
  return `progress.learningPath.segments.${segmentId}`;
}

function learningPathComponentLabelKey(componentId) {
  return `progress.learningPath.components.${componentId}`;
}

function learningPathStatusMessageKey(componentId, status) {
  if (componentId === "assessment" && status === "not_completed") return "progress.learningPath.noAssessment";
  if (componentId === "scenarios" && status === "no_eligible_scenarios") return "progress.learningPath.noEligibleScenarios";
  if (componentId === "engagement" && status === "none_completed") return "progress.learningPath.noCompletedRecommendations";
  return null;
}

export default function LearningPathProgressPanel({ value, t, compact = false, onViewJourney }) {
  const LearningPathHeading = "h2";
  const progress = normalizeLearningPathProgress(value);
  const segments = buildLearningPathSegments(progress);
  const components = [
    {
      id: "assessment",
      data: progress.assessment,
      meta: progress.assessment.totalQuestions > 0
        ? t("progress.learningPath.assessmentCount", {
          correct: progress.assessment.correctAnswers,
          total: progress.assessment.totalQuestions,
        })
        : t("progress.learningPath.noAssessment"),
    },
    {
      id: "scenarios",
      data: progress.scenarios,
      meta: progress.scenarios.totalEligible > 0
        ? t("progress.learningPath.scenarioCount", {
          completed: progress.scenarios.completedUnique,
          total: progress.scenarios.totalEligible,
        })
        : t("progress.learningPath.noEligibleScenarios"),
    },
    {
      id: "engagement",
      data: progress.engagement,
      meta: progress.engagement.completedRecommendations > 0
        ? t("progress.learningPath.recommendationCount", {
          count: progress.engagement.completedRecommendations,
        })
        : t("progress.learningPath.noCompletedRecommendations"),
    },
  ];
  const reachedCore = progress.displayedPercent >= 100;

  return (
    <div className={`card learning-path-card${compact ? " compact" : ""}`}>
      <div className="learning-path-header">
        <div>
          <LearningPathHeading className="section-title" style={{ fontSize: compact ? "1rem" : "1.1rem", marginBottom: "0.25rem" }}>
            {t("progress.learningPath.title")}
          </LearningPathHeading>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {reachedCore ? t("progress.learningPath.coreReached") : t("progress.learningPath.shortDescription")}
          </p>
        </div>
        <div className="learning-path-percent" aria-label={t("progress.learningPath.percentAria", { percent: progress.displayedPercent })}>
          {progress.displayedPercent}%
        </div>
      </div>
      <div
        className="learning-path-bar"
        role="img"
        aria-label={t("progress.learningPath.barAriaLabel", { percent: progress.displayedPercent })}
      >
        {segments.map(segment => (
          <span
            key={segment.id}
            className={`learning-path-segment ${segment.id}`}
            style={{ width: `${segment.width}%` }}
            title={t(learningPathSegmentLabelKey(segment.id), { defaultValue: segment.id })}
          />
        ))}
      </div>
      <p className="learning-path-disclaimer">{t("progress.learningPath.shortDisclaimer")}</p>
      {!compact && (
        <details className="learning-path-formula"><summary>{t("dashboard.integrated.formula")}</summary>
          <div className="learning-path-breakdown" aria-label={t("progress.learningPath.breakdownTitle")}>
            <div style={{ gridColumn: "1 / -1", fontWeight: 800, color: "#27332f", fontSize: "0.9rem" }}>
              {t("progress.learningPath.breakdownTitle")}
            </div>
            {components.map(component => {
              const statusKey = learningPathStatusMessageKey(component.id, component.data.status);
              return (
                <div key={component.id} className="learning-path-component">
                  <div className="learning-path-component-label">
                    {t(learningPathComponentLabelKey(component.id))}
                  </div>
                  <div className="learning-path-component-value">
                    {t("progress.learningPath.pointsOutOf", {
                      earned: formatLearningPathPoints(component.data.earnedPoints),
                      maximum: formatLearningPathPoints(component.data.maximumPoints),
                    })}
                  </div>
                  <div className="learning-path-component-meta">
                    {statusKey ? t(statusKey) : component.meta}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="learning-path-disclaimer">
            {t("progress.learningPath.disclaimer")}
          </div>
        </details>
      )}
      {compact && (
        <>
          <div className="learning-path-disclaimer">
            {t("progress.learningPath.shortDisclaimer")}
          </div>
          {onViewJourney && (
            <button onClick={onViewJourney} style={{ marginTop: "0.75rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              {t("progress.learningPath.viewJourney")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
