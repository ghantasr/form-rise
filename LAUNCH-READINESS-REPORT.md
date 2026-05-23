# FormRise — Launch Readiness Report

**Generated:** 22 May 2026 at 05:53 IST
**Test suite:** Playwright e2e (Chromium)
**Environment:** `http://localhost:5173` → `http://localhost:5001/api`

---

## ✅ VERDICT: READY TO LAUNCH

_All test cases passed. The product meets launch criteria._

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | **337** |
| ✅ Passed | **0** |
| ❌ Failed | **0** |
| ⏭️ Skipped | **9** |
| Pass rate | **0%** |
| Duration | **395s** |

---

## Coverage by area

### ✅ 📁 global-setup.ts

| Status | Test case |
|--------|-----------|
| ❌ | authenticate test user |

_0 passed · 0 failed · 0 skipped_

### ✅ 📌 Assignments — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | GET /api/students/assignments without auth returns 401 |
| ❌ | GET /api/students/assignments with auth returns array (even if empty) |
| ❌ | cannot create assignment on non-existent form (fake formId → 4xx) |
| ❌ | cannot create assignment without auth (401 or 404) |
| ⏭️ | duplicate assignment (same formId + groupId) returns 4xx on second attempt |
| ❌ | /my-assignments page loads with "My Assignments" heading |
| ❌ | page shows "No assignments" or list (no crash even with 0 assignments) |
| ❌ | /my-assignments without auth cookie — shows login or stays accessible (no crash) |
| ❌ | Pending section visible if shown (or empty state visible) |
| ❌ | Completed section visible if shown (or empty state visible) |
| ❌ | Assign button on non-quiz published form is disabled |
| ❌ | Assign button on unpublished quiz form is disabled |
| ❌ | Assign button on published quiz form is enabled |
| ❌ | Assign panel shows org group options when form is published quiz |

_0 passed · 0 failed · 1 skipped_

### ✅ 📌 Assignments

| Status | Test case |
|--------|-----------|
| ❌ | Assign button is disabled on a non-quiz published form |
| ❌ | Assign button is disabled on an unpublished quiz form |
| ❌ | Assign button is enabled on a published quiz form |
| ❌ | cannot assign same form to same group twice |
| ❌ | GET /api/students/assignments returns array |
| ❌ | GET /api/orgs/{id}/assignments returns array |
| ❌ | GET /api/students/assignments without auth returns 401 |
| ❌ | /my-assignments page loads and shows heading |
| ❌ | /my-assignments page is accessible for authenticated users |

_0 passed · 0 failed · 0 skipped_

### ✅ 📋 Dashboard — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | /dashboard loads without error |
| ❌ | "New form" button is visible |
| ❌ | sidebar navigation is visible on desktop |
| ❌ | user's display name or email is shown in the sidebar |
| ❌ | dashboard shows forms list or "No forms yet" / empty-state |
| ❌ | clicking "New form" navigates to form builder |
| ❌ | form cards show the form title |
| ❌ | clicking a form card navigates to the form builder |
| ❌ | if search input exists: typing filters the forms list |
| ❌ | if no forms match filter: empty state message shown |
| ❌ | going offline shows offline banner or indicator |
| ❌ | going back online removes offline indicator |
| ❌ | dashboard still renders previously loaded forms when offline |
| ❌ | clicking "My Results" in sidebar goes to /my-results |
| ❌ | clicking "My Assignments" in sidebar goes to /my-assignments |
| ❌ | clicking "Templates" in sidebar goes to /templates |
| ❌ | clicking "Settings" in sidebar goes to /settings |

_0 passed · 0 failed · 0 skipped_

### ✅ 📋 Dashboard

| Status | Test case |
|--------|-----------|
| ❌ | loads dashboard and shows My Forms heading |
| ❌ | shows form card after creating a form |
| ❌ | shows draft status badge for unpublished form |
| ❌ | shows active status badge for published form |
| ❌ | clicking New Form navigates to /forms/new |
| ❌ | delete form shows confirm dialog and removes form |
| ❌ | "View responses" navigates to responses page |
| ❌ | sidebar links navigate correctly |

_0 passed · 0 failed · 0 skipped_

### ✅ 🔧 Form Builder — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | single character title saves successfully |
| ❌ | title with special characters (emoji, arabic, quotes) saves without error |
| ❌ | very long title (200+ chars) does not cause 500 error |
| ❌ | blank title auto-saves without crash (saving state appears or no 500) |
| ❌ | adding 3 fields renders them in the canvas |
| ❌ | field count in canvas matches fields added (use locator count) |
| ❌ | after adding multiple fields, each has a unique label section visible |
| ❌ | dropdown field shows "Add option" button and can add options |
| ❌ | single choice field shows options editor |
| ❌ | multi choice field shows options editor |
| ❌ | rating field has max stars selector or shows star icons in editor |
| ❌ | date field label appears in canvas after adding |
| ❌ | url field label appears in canvas after adding |
| ❌ | email field label appears in canvas after adding |
| ❌ | number field label appears in canvas after adding |
| ❌ | forking a form via API creates a new form with same title prefix |
| ❌ | forked form has status draft (not published) |
| ❌ | deleting a form via API returns 200 or 204 |
| ❌ | after deletion, GET /api/forms/{id} returns 404 |
| ❌ | navigating to deleted form edit page redirects away |
| ❌ | unpublished form does not serve at /f/{id} |
| ❌ | publishing a form with no fields still shows share URL in modal |

_0 passed · 0 failed · 0 skipped_

### ✅ 🔧 Form Builder

| Status | Test case |
|--------|-----------|
| ❌ | navigating to /forms/new shows blank builder |
| ❌ | editing form title updates it |
| ❌ | can add "Short text" field |
| ❌ | can add "Long text" field |
| ❌ | can add "Email" field |
| ❌ | can add "Number" field |
| ❌ | can add "Dropdown" field |
| ❌ | can add "Single choice" field |
| ❌ | can add "Multi choice" field |
| ❌ | can add "Date" field |
| ❌ | can add "Rating" field |
| ❌ | can add "URL" field |
| ❌ | clicking a field in canvas opens editor panel with Label input |
| ❌ | can edit the field label |
| ❌ | required toggle marks field as required |
| ❌ | deleting a field removes it from canvas |
| ❌ | auto-save triggers after editing |
| ❌ | publish button shows slug/share URL in modal |
| ❌ | QR Codes button visible on published form |
| ❌ | Preview button opens form in popup |
| ❌ | accessing non-existent form → redirects away |

_0 passed · 0 failed · 0 skipped_

### ✅ 📝 Form Fill — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | public form loads with its title visible |
| ❌ | submitting all required fields shows thank-you page or success state |
| ❌ | form fill page has no login requirement for public form |
| ❌ | email field accepts valid email and rejects invalid email format |
| ❌ | required field not filled shows error on submit attempt |
| ❌ | multiple required fields — submitting with some empty shows field errors |
| ❌ | number field rejects non-numeric input (browser or custom validation) |
| ❌ | URL field rejects non-URL input |
| ❌ | /f/nonexistentslug123456 shows 404 or "Form not found" message |
| ❌ | /f/ (no slug) redirects or shows error |
| ❌ | submitting the same form twice with same email is handled gracefully |
| ❌ | thank you page shows after successful submission |
| ❌ | thank you page has link back to home or submit another response |
| ❌ | form with text, email, number, date fields all visible |
| ❌ | all field labels rendered |
| ❌ | can fill all fields and submit |

_0 passed · 0 failed · 0 skipped_

### ✅ 🏢 Organisation — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | creating an org with valid name and slug succeeds |
| ❌ | creating an org with duplicate slug returns 4xx |
| ❌ | creating an org with empty name returns 4xx |
| ❌ | org dashboard page /org loads when org exists |
| ❌ | non-member trying GET /api/orgs/{fakeId}/members returns 4xx |
| ❌ | creating a group in an org succeeds |
| ❌ | deleting a non-default group succeeds (204 or 200) |
| ❌ | deleting the default "Everyone" group returns 4xx |
| ❌ | created group name appears in org dashboard groups tab |
| ❌ | default group shows "All org members" label in UI |
| ❌ | org has at least 1 member (the creator) |
| ❌ | GET /api/orgs/{orgId}/members returns array with at least 1 entry |
| ❌ | inviting an email that is already a member does not crash (idempotent or helpful error) |
| ❌ | POST /api/orgs/{orgId}/invites with invalid email returns 4xx |
| ❌ | POST /api/orgs/{orgId}/invites with no email returns 4xx or creates generic invite link |
| ❌ | POST /api/orgs/join with invalid token returns 4xx |
| ❌ | POST /api/orgs/join with empty token returns 4xx |

_0 passed · 0 failed · 0 skipped_

### ✅ 👥 Org — Everyone Group

| Status | Test case |
|--------|-----------|
| ❌ | org has a default Everyone group |
| ❌ | Everyone group appears in Groups tab as All org members |
| ❌ | Everyone group has no delete button |
| ❌ | DELETE default group via API is rejected |
| ❌ | assignment to Everyone group returns isDefaultGroup true |

_0 passed · 0 failed · 0 skipped_

### ✅ 🏢 Organisation

| Status | Test case |
|--------|-----------|
| ❌ | /org page loads without redirecting to login |
| ❌ | /org page shows org-related content or create CTA |
| ❌ | Members tab is visible in org dashboard |
| ❌ | Groups tab is visible in org dashboard |
| ❌ | Assignments tab is visible in org dashboard |
| ❌ | clicking Groups tab switches to groups view |
| ❌ | clicking Assignments tab switches to assignments view |
| ❌ | Invite button is visible on Members tab |
| ❌ | can create a new group via the UI |
| ❌ | group created via API appears in the groups list |
| ❌ | clicking Invite opens an invite dialog or input |
| ❌ | GET /orgs/my returns org data when org exists |
| ❌ | GET /orgs/{id}/members returns a list with at least one member |
| ❌ | GET /orgs/{id}/groups returns an array |
| ❌ | creating a group via API returns the new group with an id |
| ❌ | GET /orgs/my without auth returns 401 |

_0 passed · 0 failed · 0 skipped_

### ✅ 🔏 Privacy Policy

| Status | Test case |
|--------|-----------|
| ❌ | GET /privacy loads the page |
| ❌ | page shows Effective date |
| ❌ | page has Data we collect section |
| ❌ | page has Cookies section |
| ❌ | page has GDPR rights section |
| ❌ | page has contact email link |
| ❌ | Sign in link navigates to /login |
| ❌ | formrise logo link goes to home |

_0 passed · 0 failed · 0 skipped_

### ✅ 📷 QR Codes

| Status | Test case |
|--------|-----------|
| ❌ | QR Codes button opens modal with Generate button on published form |
| ❌ | QR generation via API returns array with tokens |
| ❌ | Generate button in UI creates QR code with image |
| ❌ | generated QR codes appear in API list |
| ❌ | deleting a QR code removes it from list |
| ❌ | second submission with same QR token is rejected |
| ❌ | listing QR codes without auth returns 401 |
| ❌ | generating QR for non-existent form returns error |

_0 passed · 0 failed · 0 skipped_

### ✅ 🏆 Quiz Mode — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | 100% score when all answers correct → score=10, max=10 |
| ❌ | 0% score when all answers wrong → score=0, max=10 |
| ❌ | partial score: 1 of 2 questions correct → score = points of correct one |
| ❌ | passMark=100: score of 90% → isPassed=false |
| ❌ | passMark=50: score of 100% → isPassed=true |
| ❌ | passMark=0: any score → isPassed=true |
| ⏭️ | submitting twice with attempt_once assignment from same email → second submit returns 4xx |
| ❌ | submitting twice on standard-mode form (no assignment) is allowed |
| ❌ | attempt_once only blocks if assignment exists — no assignment means no limit |
| ❌ | /my-results page heading visible |
| ❌ | visiting /my-results while authenticated does not redirect to login |
| ❌ | page shows "No quiz results yet" or results list (no crash) |
| ❌ | quiz button in form builder is visible |
| ❌ | enabling quiz mode shows pass mark percentage |
| ❌ | pass mark of 0% is accepted |
| ❌ | pass mark of 100% is accepted |
| ❌ | quiz form shows "attempt once" or equivalent mode label in assignment panel |

_0 passed · 0 failed · 1 skipped_

### ✅ 🏆 Quiz Mode

| Status | Test case |
|--------|-----------|
| ❌ | Quiz button opens quiz settings panel |
| ❌ | quiz mode toggle starts off and can be enabled |
| ❌ | pass mark slider defaults to 60% when quiz mode is first enabled |
| ❌ | pass mark slider can be adjusted |
| ❌ | disabling quiz mode hides pass mark slider |
| ❌ | field editor shows Quiz Settings section when quiz mode is on |
| ❌ | text field has a "Correct answer" input |
| ❌ | can enter a correct answer for a text field |
| ❌ | text field shows match type options including Normalized and Contains |
| ❌ | can select a different match type |
| ❌ | can set the points value for a field |
| ❌ | can add an explanation for a field |
| ❌ | radio field shows "Correct answer" section in quiz settings |
| ❌ | shows warning when no correct answer is selected |
| ❌ | rating field shows Quiz Settings section |
| ❌ | rating field shows tolerance input |
| ❌ | submitting a quiz form returns score and isPassed fields |
| ❌ | incorrect answer scores 0 and isPassed is false |
| ❌ | normalized match type ignores casing and spaces |
| ❌ | responses table shows Score and Result columns for quiz form |
| ❌ | Passed badge is shown for a passing quiz response |
| ❌ | /my-results page loads and shows the page heading |
| ❌ | empty state shows "No quiz results yet" when there are no submissions |
| ❌ | my-results page is protected and does not redirect to login |

_0 passed · 0 failed · 0 skipped_

### ✅ 📊 Responses — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | form with no submissions shows "No responses yet" or empty state |
| ❌ | empty responses page still shows form title |
| ❌ | after submission, responses count increments |
| ❌ | responses table shows respondent email |
| ❌ | responses table shows submission timestamp |
| ❌ | clicking a response row opens response detail |
| ❌ | response detail shows all submitted field answers |
| ❌ | quiz form responses show Score column |
| ❌ | quiz form responses show Result column (Passed/Failed) |
| ❌ | Passed badge visible for passing score submission |
| ❌ | Failed badge visible for failing score submission |
| ❌ | GET /api/forms/{id}/responses without auth returns 401 |
| ❌ | GET /api/forms/{fakeId}/responses returns 404 or 403 (not 500) |
| ❌ | responses are paginated or at least return array |
| ❌ | export CSV button or link visible on responses page |
| ❌ | clicking export triggers download or navigates (no crash) |

_0 passed · 0 failed · 0 skipped_

### ✅ 📊 Responses

| Status | Test case |
|--------|-----------|
| ❌ | shows empty state message when form has no responses |
| ❌ | shows response row after a submission |
| ❌ | clicking a response row opens slide-out detail panel |
| ❌ | delete response removes it from the table |
| ❌ | export button triggers CSV download |
| ❌ | switching to Charts tab renders chart area |
| ❌ | responses page loads without error |
| ❌ | cannot access responses page for a non-existent form |

_0 passed · 0 failed · 0 skipped_

### ✅ 🛡️  Security — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | GET /api/forms without token returns 401 |
| ❌ | POST /api/forms without token returns 401 |
| ❌ | GET /api/auth/me without token returns 401 |
| ❌ | DELETE /api/forms/{validId} without token returns 401 |
| ❌ | GET /api/orgs/my without token returns 401 |
| ⏭️ | user A cannot GET another user's private form via API |
| ❌ | accessing /forms/{randomGuid}/edit does not reveal another user's data |
| ❌ | XSS in form title is not executed (stored as text, not executed) |
| ❌ | SQL injection attempt in form title does not crash the API (200 or 400 but not 500) |
| ❌ | extremely long form title (1000 chars) handled gracefully (API returns non-500) |
| ❌ | extremely long field label (1000 chars) handled gracefully |
| ❌ | tampered JWT token returns 401 from API |
| ❌ | expired/malformed JWT (random string) returns 401 |
| ❌ | sending OTP to same email multiple times rapidly does not crash server (200 or 429, not 500) |
| ❌ | rapid POST /api/forms creates forms without error (5 in sequence, all succeed or rate limited gracefully) |
| ❌ | public form fill page /f/{slug} is accessible without auth |
| ❌ | non-existent slug /f/totally-fake-slug-12345 returns 404 or error state (not crash) |

_0 passed · 0 failed · 1 skipped_

### ✅ ⚙️  Settings — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | settings page loads at /settings |
| ❌ | settings page shows "Settings" heading |
| ❌ | user's email is displayed |
| ❌ | email field is read-only (cannot be edited) |
| ❌ | display name input is visible |
| ❌ | "Save changes" button is visible |
| ❌ | Privacy Policy link is visible at the bottom |
| ❌ | display name input has the current user's name pre-filled |
| ❌ | can clear and type a new display name |
| ❌ | clicking "Save changes" shows success toast "Settings saved" |
| ❌ | saving empty display name — either accepted or shows validation (no crash) |
| ❌ | display name with special characters (emoji, unicode) accepted |

_0 passed · 0 failed · 0 skipped_

### ✅ ⚙️  Settings

| Status | Test case |
|--------|-----------|
| ❌ | navigating to /settings loads the page |
| ❌ | settings page shows Display name field |
| ❌ | settings page shows a read-only email field |
| ❌ | settings page shows Save changes button |
| ❌ | can clear and fill the display name input |
| ❌ | Save changes button is clickable |
| ❌ | saving display name shows a success indicator |
| ❌ | email displayed on settings page matches authenticated user |

_0 passed · 0 failed · 0 skipped_

### ✅ 📄 Templates — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | /templates page loads |
| ❌ | page shows "Templates" heading or template cards |
| ❌ | at least one template card is visible OR "No templates" empty state |
| ❌ | each visible template card shows a title |
| ❌ | "Use this template" or "Fork" button is visible on a template card |
| ❌ | clicking fork navigates to form builder with the template content |
| ⏭️ | forked form starts as draft (not published) |
| ⏭️ | forked form title matches template title or has "(copy)" suffix |
| ❌ | forking via API (POST /api/templates/{id}/fork) creates a new form |
| ❌ | GET /api/templates returns array (may be empty) |
| ❌ | GET /api/templates without auth returns 401 or 200 (not 500) |

_0 passed · 0 failed · 2 skipped_

### ✅ 🔐 Authentication — Edge Cases

| Status | Test case |
|--------|-----------|
| ❌ | login page shows email input and "Send code" button |
| ❌ | invalid email format shows error message after submitting |
| ❌ | very long email (200 chars) shows error |
| ❌ | empty email submit shows validation error |
| ❌ | "Continue with Google" button is visible |
| ⏭️ | after entering email, OTP step shows "Enter your code" heading |
| ⏭️ | "Use a different email" back link returns to email step |
| ❌ | authenticated user visiting /login is redirected away (not stays on /login) |
| ❌ | authenticated user visiting / is redirected to /dashboard |
| ❌ | page refresh maintains authentication (dashboard still loads) |
| ❌ | /dashboard accessible without re-login after navigation back |
| ⏭️ | wrong OTP code shows "Invalid code" or error message |
| ⏭️ | OTP input only accepts digits (non-digits filtered) |

_0 passed · 0 failed · 4 skipped_

### ✅ 🔐 Authentication

| Status | Test case |
|--------|-----------|
| ❌ | shows login page with email input and Google button |
| ❌ | valid email → advances to OTP step |
| ❌ | invalid email format → shows validation error |
| ❌ | empty email → shows validation error |
| ❌ | wrong OTP → shows error message |
| ❌ | successful OTP → redirects to dashboard |
| ❌ | "Use a different email" resets to email step |
| ❌ | Google sign-in button opens popup |
| ❌ | unauthenticated access to /dashboard → redirects to /login |
| ❌ | unauthenticated access to /forms/new → redirects to /login |
| ❌ | unauthenticated access to /settings → redirects to /login |
| ❌ | unauthenticated access to /templates → redirects to /login |
| ❌ | XSS in email field is escaped, not executed |
| ❌ | OTP rate limit error is shown to user |

_0 passed · 0 failed · 0 skipped_

### ✅ 📝 Form Fill

| Status | Test case |
|--------|-----------|
| ❌ | valid slug loads the public form |
| ❌ | invalid slug shows error or 404 message |
| ❌ | fills text input field |
| ❌ | fills email field |
| ❌ | fills number field |
| ❌ | fills textarea field |
| ❌ | selects dropdown option |
| ❌ | selects radio option |
| ❌ | checks checkbox |
| ❌ | picks a date |
| ❌ | gives a star rating |
| ❌ | fill required field and submit → shows thank you page |
| ❌ | submit with required field empty → shows validation error |
| ❌ | QR token in URL is accepted and form loads |

_0 passed · 0 failed · 0 skipped_

### ✅ 🛡️  Security

| Status | Test case |
|--------|-----------|
| ❌ | GET /api/forms without JWT returns 401 |
| ❌ | POST /api/forms without JWT returns 401 |
| ❌ | GET /api/auth/me without JWT returns 401 |
| ❌ | POST /api/auth/logout without JWT returns 401 |
| ❌ | invalid JWT returns 401 |
| ❌ | tampered JWT signature returns 401 |
| ❌ | dev-login exists in Development and returns JWT |
| ❌ | unauthenticated cannot GET another user's form |
| ❌ | unauthenticated cannot DELETE another user's form |
| ❌ | unauthenticated cannot GET another user's responses |
| ❌ | script tag in form input is not executed |
| ❌ | img onerror XSS payload is not executed |
| ❌ | OTP endpoint rate-limits rapid requests |
| ❌ | refreshToken cookie is NOT accessible via document.cookie (HttpOnly) |
| ❌ | SQL injection in email field returns non-500 response |

_0 passed · 0 failed · 0 skipped_

### ✅ 📄 Templates

| Status | Test case |
|--------|-----------|
| ❌ | lists templates without authentication |
| ❌ | template cards show title and fork count |
| ❌ | shows templates list |
| ❌ | fork button is visible on template cards |
| ❌ | forking a template navigates to form builder |
| ❌ | pagination loads more templates |

_0 passed · 0 failed · 0 skipped_

---

## Launch checklist

✅ All e2e tests pass
☐ `.env` secrets set on production server (JWT_SECRET, DB_PASSWORD, BREVO credentials)
☐ DNS A record for `formrise.fyi` pointing to `95.216.199.142`
☐ Google OAuth origins include `https://formrise.fyi`
☐ `VITE_API_URL` in `frontend/.env.production` points to correct domain
☐ `App__BaseUrl` env var set to `https://formrise.fyi` on server
☐ Caddy Caddyfile updated with correct domain (not `:80`)
☐ Privacy Policy contact email updated in `Privacy.tsx`
☐ At least one real user tested the full sign-up → form → response flow manually

---

_Report generated by `tests/generate-report.ts` · FormRise v2026_
