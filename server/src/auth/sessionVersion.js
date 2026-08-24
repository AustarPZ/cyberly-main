function applyAuthenticatedSession(session, user) {
  session.userId = user.id;
  session.role = user.role;
  session.sessionVersion = Number(user.session_version ?? user.sessionVersion ?? 0);
}

module.exports = {
  applyAuthenticatedSession,
};
