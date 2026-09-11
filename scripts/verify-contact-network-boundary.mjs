import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
let action, failure = null;
const result = { error: 'Returned server validation message' };
const output = ts.transpileModule(readFileSync('src/app/contact/ContactForm.tsx', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', output)(name => {
  if (name === 'react') return { useActionState: reducer => { action = reducer; return [{ error: null }, () => {}, false]; }, useRef: () => ({ current: null }), useEffect: () => {} };
  if (name === '@/app/commercial-actions') return { createCommercialInquiryAction: async () => { if (failure) throw failure; return result; } };
  if (name.endsWith('.css')) return { default: {} };
  return require(name);
}, loadedModule, loadedModule.exports);
loadedModule.exports.ContactForm({ children: null });
assert.equal(await action({ error: null }, new FormData()), result);
failure = new TypeError('Failed to fetch');
assert.match((await action({ error: null }, new FormData())).error, /Check your connection/);
for (const error of [Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;push;/contact?sent=1;303;' }), new Error('unexpected')]) {
  failure = error;
  await assert.rejects(action({ error: null }, new FormData()), caught => caught === error);
}
console.log('PASS: returned server state and fetch failure handled; redirect and unexpected Error objects rethrown unchanged.');
