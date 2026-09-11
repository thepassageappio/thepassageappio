# Entry form validation checks

Both live sites reported verified main `b207fb8bd60c84f73ddee326245064571fdfbae2`. `scripts/verify-entry-validation.mjs` passed 18 cases: workspace start, sample sign-in and contact, on two origins at 1280/390/360 pixels. The cases exercised 42 invalid submission attempts. No product fix was needed for the tested native validation paths.

Empty required fields and malformed email addresses focused the expected field and exposed a nonempty browser validation message. The contact form also stopped at its unchecked contact-permission checkbox after the other required fields were completed. Typed names, organization and message values remained present after invalid attempts. Correcting all required values made native checkValidity return true; no valid form was submitted. Each checked field had an associated nonempty label. Pages had no horizontal overflow or page errors.

The test installed two independent safeguards: a capture listener preventing all submit events and a browser route blocking non-read requests. Native invalidity prevented every submit event before the listener was needed; no application write reached the route. Observed analytics requests were blocked. Fictional local form values used example.invalid and were not sent.

## Verification detail and limits

An initial assertion treated a field top of -0.015625 CSS pixels as offscreen on both phone widths. A focused check confirmed the input's remaining 47.984375 pixels were visible and browser validation focused the correct field. The test now allows one CSS pixel for fractional scroll rounding. It does not claim that every part of a field's separate label or native validation popup is visible, or that a real screen reader announces the error correctly.

This proves browser-side invalid-form behavior and retained DOM values only. It does not prove server errors, network-failure recovery, successful account creation, inquiry delivery, consent recording or persistent state. Authenticated first-use and real screen-reader tests remain open. The fresh demo still depends on the already-requested participant addresses and test-email authorization.

Focused ESLint and git diff checks passed. Raw evidence is in ignored `work/entry-validation-proof.json`. PR 109 was open at c20f2a2 before this test/documentation commit; its policy implementation remains unfinished. Hosted cancellation and database history were reconciled from the existing evidence without SQL, migration or send reruns. No deployment, new reconciliation day or additional automation occurred.
