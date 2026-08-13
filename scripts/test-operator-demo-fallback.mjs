import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile('app/demo/actions.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: 'app/demo/actions.ts',
  reportDiagnostics: true,
});

let activeClient;
const module = { exports: {} };
const context = {
  module,
  exports: module.exports,
  process: {
    env: {
      PASSAGE_PREVIEW_DEMO_DIRECTOR_EMAIL: 'director@example.test',
      PASSAGE_PREVIEW_DEMO_DIRECTOR_PASSWORD: 'a'.repeat(24),
      PASSAGE_PREVIEW_DEMO_STAFF_EMAIL: 'staff@example.test',
      PASSAGE_PREVIEW_DEMO_STAFF_PASSWORD: 'b'.repeat(24),
      PASSAGE_PREVIEW_DEMO_VENDOR_EMAIL: 'vendor@example.test',
      PASSAGE_PREVIEW_DEMO_VENDOR_PASSWORD: 'c'.repeat(24),
    },
  },
  require(specifier) {
    if (specifier === 'next/navigation') {
      return {
        redirect(target) {
          throw Object.assign(new Error(`redirect:${target}`), { target });
        },
      };
    }
    if (specifier === '@/lib/presentation/operator-demo-availability') {
      return { hasConfiguredOperatorDemoSession: () => true };
    }
    if (specifier === '@/lib/supabase/server') {
      return { createPassageServerClient: async () => activeClient };
    }
    throw new Error(`Unexpected import: ${specifier}`);
  },
};
vm.runInNewContext(compiled.outputText, context, {
  filename: 'app/demo/actions.ts',
});

const { startPreviewDemo } = module.exports;
function personaForm(persona) {
  const form = new FormData();
  form.set('persona', persona);
  return form;
}
const cases = [
  ['director', '/demo/operator/director', '/director', 'director@example.test'],
  ['staff', '/demo/operator/staff', '/staff', 'staff@example.test'],
  ['vendor', '/demo/operator/vendor', '/partner', 'vendor@example.test'],
];

for (const [persona, fallback, success, email] of cases) {
  let signOutCalls = 0;
  activeClient = {
    auth: {
      async signOut() {
        signOutCalls += 1;
        return { error: null };
      },
      async signInWithPassword() {
        return {
          data: { user: null },
          error: {
            code: 'invalid_credentials',
            message: 'Invalid login credentials',
          },
        };
      },
    },
  };
  await assert.rejects(
    startPreviewDemo(personaForm(persona)),
    (error) => error?.target === fallback,
    `${persona} invalid_credentials must open its guided browser demo`,
  );
  assert.equal(
    signOutCalls,
    2,
    `${persona} invalid_credentials must attempt cleanup before guided fallback`,
  );

  activeClient = {
    auth: {
      async signOut() {
        return { error: null };
      },
      async signInWithPassword() {
        return { data: { user: { email } }, error: null };
      },
    },
  };
  await assert.rejects(
    startPreviewDemo(personaForm(persona)),
    (error) => error?.target === success,
    `${persona} configured success must retain its protected persona target`,
  );
}

console.log('operator demo configured sign-in fallback: PASS');
