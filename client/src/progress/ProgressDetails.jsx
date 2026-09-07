import React from "react";
import { normalizeActivityComposition, normalizeRecentLearningActivity, PROGRESS_SECTION_IDS } from "./progressSemantics";
import { getAchievementDefinitions, getLearningInterestStateKey } from "../product/productSemantics";

// Presentation only. Dashboard owns the response and every persistence action.
export default function ProgressDetails({ progress, user, topics, t, locale, onExplore }) {
  const composition = normalizeActivityComposition(progress.activityComposition);
  const recent = normalizeRecentLearningActivity(progress.recentLearningActivity);
  const interests = user.helpTopics || [];
  const profile = user.profile || {};
  const achievements = getAchievementDefinitions({
    hasJoined: true,
    hasHelpTopics: interests.length > 0,
    hasMultipleLanguages: Boolean(profile.preferredLanguage && profile.preferredLanguage !== "english"),
    hasAssessmentBaseline: Boolean(progress.summary?.exists),
  });
  function activityDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  }
  return <div className="integrated-progress-details">
    <section id={PROGRESS_SECTION_IDS.LEARNING_ACTIVITY} className="card progress-anchor" aria-labelledby="integrated-activity-heading">
      <h2 id="integrated-activity-heading">{t("progress.recentActivity.title")}</h2>
      <p>{t("progress.recentActivity.description")}</p>
      {recent.length ? <ol className="recent-activity-list">
        {recent.map((activity, index) => <li className="recent-activity-item" key={`${activity.type}-${activity.occurredAt}-${index}`}>
          <div><strong>{t(`progress.recentActivity.types.${activity.type}`, { defaultValue: activity.label })}</strong>
            {activity.topicCode && <p>{t(`topics.${activity.topicCode}`, { defaultValue: activity.topicCode })}</p>}
          </div>
          <time dateTime={activity.occurredAt}>{activityDate(activity.occurredAt)}</time>
        </li>)}
      </ol> : <p>{t("progress.recentActivity.empty")}</p>}
    </section>
    <details className="card progress-secondary">
      <summary>{t("dashboard.integrated.moreDetails")}</summary>
      <section className="activity-composition-card">
        <h2>{t("progress.activityComposition.title")}</h2>
        <p>{t("progress.activityComposition.description")}</p>
        {composition.segments.length ? <>
          <p>{t("progress.activityComposition.recordedActivitiesCount", { count: composition.totalRecordedActivities })}</p>
          <div className="activity-composition-bar" role="img" aria-label={t("progress.activityComposition.barAriaLabel")}>
            {composition.segments.map(segment => <span key={segment.id} className={`activity-composition-segment ${segment.id}`} style={{ width: `${segment.sharePercentage}%` }} />)}
          </div>
          <ul className="activity-composition-legend">
            {composition.segments.map(segment => <li key={segment.id}>
              <strong>{t(`progress.activityComposition.segments.${segment.id}`, { defaultValue: segment.label })}</strong>
              <p>{t(`progress.activityComposition.segmentCounts.${segment.id}`, { count: segment.count, defaultValue: segment.displayValue })} · {t("progress.activityComposition.shareOfActivity", { share: segment.sharePercentage })}</p>
            </li>)}
          </ul>
        </> : <p>{t("progress.activityComposition.empty")}</p>}
        <p className="activity-composition-disclaimer">{t("progress.activityComposition.explanation")} {t("progress.activityComposition.disclaimer")}</p>
      </section>
      <section>
        <h2>{t("progress.learningInterests.title")}</h2>
        <p>{t("progress.learningInterests.description")}</p>
        <div className="integrated-interests">{topics.map(topic => <div key={topic.value}>
          <strong>{t(`profileOptions.helpTopics.${topic.value}`, { defaultValue: topic.label })}</strong>
          <p>{t(getLearningInterestStateKey(interests.includes(topic.value)))}</p>
        </div>)}</div>
        <button className="btn-ghost" onClick={onExplore}>{t("progress.learningActivity.exploreAll")}</button>
      </section>
      <section id={PROGRESS_SECTION_IDS.BADGES} className="progress-anchor">
        <h2>{t("progress.achievements.title")}</h2>
        <p>{t("progress.achievements.description")}</p>
        <div className="integrated-badges">{achievements.map(badge => <div key={badge.labelKey}>
          <span aria-hidden="true">{badge.icon}</span> <strong>{t(badge.labelKey)}</strong>
          {badge.earned && <p>{t("progress.achievements.earned")}</p>}
        </div>)}</div>
      </section>
    </details>
  </div>;
}
