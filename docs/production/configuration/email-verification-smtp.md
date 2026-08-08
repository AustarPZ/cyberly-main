# Email Verification SMTP Runtime Setup

Status: AUTH-EV-6E implementation support.

This document describes how to configure Cyberly email verification for real SMTP delivery. Do not store real SMTP credentials in this repository.

## Transport Modes

Cyberly supports these backend email transport modes:

- `EMAIL_TRANSPORT=disabled`: local no-op mode. Registration continues and no email is sent.
- `EMAIL_TRANSPORT=test-success`: deterministic automated-test success mode. No live email is sent.
- `EMAIL_TRANSPORT=test-fail`: deterministic automated-test failure mode. No live email is sent.
- `EMAIL_TRANSPORT=smtp`: real SMTP delivery mode for owner runtime verification and production-like environments.

Automated tests must not send live email. Use `test-success`, `test-fail`, or injected transports for tests.

## Required SMTP Variables

Set these variables in the backend runtime environment when using `EMAIL_TRANSPORT=smtp`:

```text
CLIENT_BASE_URL=https://your-frontend-host.example
EMAIL_TRANSPORT=smtp
EMAIL_FROM_NAME=Cyberly
EMAIL_FROM_ADDRESS=your-sender-address@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password-or-app-password
```

Use `SMTP_PORT=587` and `SMTP_SECURE=false` only if the SMTP provider requires STARTTLS on port 587.

## Gmail App Password Notes

For Gmail-based SMTP, the owner should use a Google App Password rather than a normal Google account password.

Recommended owner setup:

1. Enable 2-Step Verification on the sender Google account.
2. Create an App Password for the mail-sending app.
3. Store the generated app password only in the backend hosting environment variable `SMTP_PASSWORD`.
4. Set `SMTP_HOST=smtp.gmail.com`.
5. Use either `SMTP_PORT=465` with `SMTP_SECURE=true`, or the Gmail-supported STARTTLS configuration required by the deployment environment.

Do not paste the app password into documentation, tests, screenshots, chat messages, browser consoles, or committed files.

## Verification Link Format

Verification emails should link to the frontend hash route:

```text
CLIENT_BASE_URL/#/verify-email?token=<encoded-token>
```

The raw verification token must only be included in the email link sent to the account owner. Cyberly stores only hashed verification tokens in the database.

## Owner Runtime Checklist

Use this checklist after the SMTP variables are configured in a safe backend runtime environment:

### SMTP Success

1. Start the backend with `EMAIL_TRANSPORT=smtp`.
2. Register a new test account using an email inbox controlled by the owner.
3. Confirm the registration response does not expose the raw token.
4. Confirm a Cyberly verification email arrives.
5. Open the verification link from the email.
6. Confirm the frontend loads `#/verify-email?token=...`.
7. Submit or allow the page to verify the token according to the current UI flow.
8. Confirm the account becomes verified.
9. Reopen the same verification link and confirm it returns a neutral already-verified result.
10. Confirm the reused link does not switch the active account/session, create another verification side effect, or expose sensitive account details.
11. Confirm CyberGuard access follows the existing verified-email gate.

### SMTP Failure

1. Configure an intentionally invalid SMTP password or test SMTP failure in a safe non-production runtime.
2. Register a new test account.
3. Confirm the account is created and remains unverified.
4. Confirm the UI shows the safe send-failure message.
5. Confirm the API response does not expose SMTP provider details, credentials, raw tokens, token hashes, stack traces, or transport configuration.
6. Confirm the failed verification token is not active and the learner can retry resend without a false cooldown.

### Disabled Transport

1. Start the backend with `EMAIL_TRANSPORT=disabled`.
2. Register a new test account.
3. Confirm no live email is sent.
4. Confirm the UI shows the delivery-not-configured message.
5. Confirm the response reports `emailTransportDisabled=true` and does not report `emailSendFailed=true`.

### Resend and Link Lifecycle

1. Use an unverified authenticated account and click resend.
2. Confirm successful delivery starts the expected resend cooldown.
3. Confirm cooldown responses preserve `Retry-After` behaviour.
4. Confirm a newer verification link revokes older active links.
5. Confirm a revoked old link shows the safe replaced-link state.
6. Confirm a reused already-successful link shows the neutral already-verified state.
7. Confirm opening a verification link for another account does not switch the current logged-in account.
8. Reload the browser and confirm verified/unverified state persists according to the backend account state.
9. Repeat key checks in English, Bahasa Melayu, and Simplified Chinese.
10. Check mobile layout and keyboard focus for the verification page and resend controls.
11. Inspect Network and server console output for privacy: no credentials, raw tokens, token hashes, provider payloads, stack traces, or internal transport configuration should appear.

## Failure Handling

If SMTP delivery fails, learner-facing responses must remain safe and generic. They must not expose:

- SMTP username or password.
- Provider response payloads.
- Stack traces.
- Raw tokens.
- Internal transport configuration.

Owner runtime acceptance is pending until a real inbox receives and verifies an email successfully.
