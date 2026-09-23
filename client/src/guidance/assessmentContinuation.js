const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => Number.isSafeInteger(value) && value > 0;
const keys = (value, names) => record(value) && Object.keys(value).length === names.length && names.every(name => Object.prototype.hasOwnProperty.call(value, name));
const handoffKeys = ['attemptId', 'authScopeRevision', 'targetRevision', 'acceptedNavigationGeneration'];
const stampKeys = [...handoffKeys, 'requestGeneration', 'locale'];

export function validAssessmentResumeTarget(value) {
  return keys(value, ['type', 'attemptId']) && value.type === 'resume_assessment' && id(value.attemptId);
}

export function validAssessmentResumeHandoff(value) {
  return keys(value, handoffKeys) && handoffKeys.every(key => id(value[key]));
}

export function sameAssessmentResumeContext(first, second) {
  return keys(first, stampKeys) && keys(second, stampKeys) && stampKeys.every(key => first[key] === second[key]);
}

export function assessmentResumeFailure(response) {
  if (response?.status === 401) return 'AUTH_LOST';
  if (response?.status === 404) return 'NOT_FOUND_OR_FOREIGN';
  if (response?.network || response?.status >= 500) return 'NETWORK_ERROR';
  return 'REQUEST_REJECTED';
}

// Content availability cannot overturn a successful exact-attempt authority.
export function assessmentResumeContentFailure(response) {
  if (response?.status === 404) return 'INCONSISTENT_ATTEMPT';
  return assessmentResumeFailure(response);
}

// The attempt GET is the sole resume authority. Content never supplies an attempt.
export function validateAssessmentResumeResponse(target, response) {
  if (!record(target) || !id(target.attemptId)) return 'INVALID_TARGET';
  if (!response?.ok) return assessmentResumeFailure(response);
  const attempt = response.data?.attempt;
  if (attempt?.id !== target.attemptId) return 'IDENTITY_MISMATCH';
  return attempt.status === 'in_progress' ? null : 'NOT_IN_PROGRESS';
}

export function validateAssessmentResumeContent(attempt, content) {
  const inconsistent = 'INCONSISTENT_ATTEMPT';
  const { assessment, questions } = content || {};
  if (!id(attempt?.assessmentId) || assessment?.id !== attempt.assessmentId
    || !Array.isArray(questions) || !questions.length
    || assessment.questionCount !== questions.length || !Array.isArray(attempt.answers)) return inconsistent;
  const optionsByQuestion = new Map();
  for (const question of questions) {
    if (!record(question) || !id(question.id) || optionsByQuestion.has(question.id)
      || typeof question.prompt !== 'string' || !question.prompt.trim()
      || !Array.isArray(question.options) || !question.options.length) return inconsistent;
    const options = new Set();
    for (const option of question.options) {
      if (!record(option) || typeof option.key !== 'string' || !option.key.trim()
        || typeof option.text !== 'string' || !option.text.trim() || options.has(option.key)) return inconsistent;
      options.add(option.key);
    }
    optionsByQuestion.set(question.id, options);
  }
  const answered = new Set();
  for (const answer of attempt.answers) {
    if (!record(answer) || answered.has(answer.questionId)
      || !optionsByQuestion.get(answer.questionId)?.has(answer.selectedOptionKey)) return inconsistent;
    answered.add(answer.questionId);
  }
  return null;
}

export const assessmentResumeReasonKey = {
  INVALID_TARGET: 'invalidTarget', AUTH_LOST: 'authLost', NOT_FOUND_OR_FOREIGN: 'unavailable',
  IDENTITY_MISMATCH: 'identityMismatch', NOT_IN_PROGRESS: 'notInProgress',
  INCONSISTENT_ATTEMPT: 'inconsistent', NETWORK_ERROR: 'networkError', REQUEST_REJECTED: 'requestRejected',
};
