#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const demoAction = read('app/demo/actions.ts');
const gateway = read('app/demo/page.tsx');
const demoModel = read('lib/demo.ts');
const urgentNext = read('app/start/next/UrgentNextClient.tsx');
const partnerForm = read('app/director/cases/[workflowId]/PartnerRequestForms.tsx');
const partnerAction = read('app/director/cases/[workflowId]/partner-actions.ts');
const categoryMigration = read('supabase/migrations/20260727025310_partner_vendor_category_compatibility.sql');
const categoryTest = read('supabase/tests/partner_vendor_category_compatibility.sql');
const rotation = read('scripts/rotate-preview-demo-credentials.mjs');
const mobileRail = read('components/operations/ContinuityRail.module.css');
const vendorResponse = read('app/partner/RespondToRequestForm.tsx');
const vendorActions = read('app/partner/actions.ts');
const durableReceipt = read('components/operations/DurableReceipt.tsx');
const durableReceiptPresenter = read('lib/presentation/durable-receipts.ts');
const directorActions = read('app/director/actions.ts');
const directorCase = read('app/director/cases/[workflowId]/page.tsx');

for (const persona of ['FAMILY', 'DIRECTOR', 'STAFF', 'VENDOR']) assert(rotation.includes(`'${persona}'`));
assert(demoAction.includes('persona.toUpperCase()'));
assert(demoAction.includes("export type DemoPersona = 'family' | 'director' | 'staff' | 'vendor'"));
assert(demoAction.includes("family: '/start/next'"));
assert(rotation.includes('PASSAGE_PREVIEW_DEMO_${persona}_EMAIL'));
assert(rotation.includes('PASSAGE_PREVIEW_DEMO_${persona}_PASSWORD'));
assert(demoAction.includes("process.env.VERCEL_ENV !== 'preview'"));
assert(demoAction.includes("configuration.projectRef !== 'uyacxqtsiwlvtmhxvoxr'"));
assert(!demoAction.includes('NEXT_PUBLIC_DEMO'));
assert(gateway.includes('startPreviewDemo') && demoModel.includes('Start without signing in'));
assert(demoModel.includes('continue with the private browser demo or sign in to an existing demo account'));
assert(gateway.includes('does not create family records, send messages, make purchases, or process payments'));
assert(urgentNext.includes('action={startPreviewDemo}'));
assert(urgentNext.includes('Sign in to an existing demo account'));
assert(!/create account/i.test(urgentNext));
assert(!/check your email/i.test(urgentNext));

assert(partnerForm.includes('humanCategory(selectedPartner.category)'));
assert(!partnerForm.includes('name="category"'));
assert(!partnerAction.includes("formData.get('category')"));
assert(partnerAction.includes('let category = existingRequestResult.data?.category;'));
assert(partnerAction.includes(".eq('status', 'active')"));
assert(categoryMigration.includes('partner_requests_category_guard'));
assert(categoryMigration.indexOf('passage_private.can_manage_location(') < categoryMigration.indexOf('pg_catalog.pg_advisory_xact_lock('));
assert(categoryMigration.indexOf('pg_catalog.pg_advisory_xact_lock(') < categoryMigration.indexOf('select request.* into v_existing'));
assert(categoryTest.includes('Denied category mismatch left a partial write'));
assert(categoryTest.includes('Expected append-only event update denial'));
assert(categoryTest.includes('Expected append-only event delete denial'));
assert(rotation.includes('PASSAGE_PREVIEW_DEMO_CREDENTIAL_ROTATION_APPROVED'));
assert(rotation.includes('without printing secret values'));
assert(!mobileRail.includes('.rail ol { min-width: 520px; }'));

assert(vendorResponse.includes('Save sample quote for Northstar'));
assert(vendorActions.includes('No purchase or payment occurred.'));
assert(vendorActions.includes('Not visible to the Rivera family.'));
assert(vendorActions.includes('The request is not complete yet.'));
assert(partnerForm.includes('It does not create a payment or send a message to the Rivera family.'));
for (const label of ['Changed by', 'Saved', 'Result', 'Visible to', 'Saved in', 'Next']) assert(durableReceipt.includes(label));
assert(durableReceipt.includes('announce = false'));
assert(!vendorActions.includes('new Date().toISOString()'));

assert(directorActions.includes('taskAssignmentReceipt({'));
assert(directorCase.includes('taskAssignmentReceipt({'));
assert(durableReceiptPresenter.includes('humanizeMemberIdentity(input.actorName, input.actorEmail'));
assert(durableReceiptPresenter.includes('humanizeMemberIdentity(input.assigneeName, input.assigneeEmail'));
assert(durableReceiptPresenter.includes("humanizePreviewLabel(input.taskTitle ?? '', 'this commitment')"));
assert(directorActions.includes('taskStatus: taskResult.data.status'));
assert(directorCase.includes('taskStatus: selectedTask.status'));
assert(durableReceiptPresenter.includes("input.taskStatus === 'assigned'"));
assert(durableReceiptPresenter.includes('continues the work shown above.'));

assert(partnerAction.includes('vendorRequestSentReceipt({'));
assert(directorCase.includes('vendorRequestSentReceipt({'));
assert(directorCase.includes("candidate.name === 'partner_request.sent'"));
assert(durableReceiptPresenter.includes("humanizePreviewLabel(input.requestTitle ?? '', 'Memorial flowers')"));
assert(durableReceiptPresenter.includes("humanizePreviewLabel(input.partnerName ?? '', 'the selected vendor')"));
assert(durableReceiptPresenter.includes('`${changedBy} sent ${requestTitle} to ${partnerName}.`'));
assert(partnerAction.includes(".select('title, partner_organization_id')"));
assert(partnerAction.includes(".select('name')"));

console.log('PASS Release Packet demo, vendor authority, and durable receipt contract');
