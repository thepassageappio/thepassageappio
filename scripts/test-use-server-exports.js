const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repositoryRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repositoryRoot, 'app');
const requiredCycle8ServerActions = [
  { file: 'app/staff/actions.ts', exportName: 'submitTaskProof' },
  { file: 'app/director/actions.ts', exportName: 'reviewTaskProof' },
];

function isExported(statement) {
  return Boolean(statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function isAsync(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword));
}

function validateUseServerSource(fileName, sourceText) {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let hasUseServerDirective = false;
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    if (statement.expression.text === 'use server') hasUseServerDirective = true;
  }
  if (!hasUseServerDirective) return [];

  const errors = [];
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      const value = statement.expression;
      const asyncFunctionValue = (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) && isAsync(value);
      if (!asyncFunctionValue) errors.push(`${fileName}: default runtime export is not an async function`);
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      const typeOnlyElements = statement.exportClause
        && ts.isNamedExports(statement.exportClause)
        && statement.exportClause.elements.every((element) => element.isTypeOnly);
      if (!statement.isTypeOnly && !typeOnlyElements) errors.push(`${fileName}: runtime re-export cannot be proven to be an async function`);
      continue;
    }
    if (!isExported(statement)) continue;
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) continue;
    if (ts.isFunctionDeclaration(statement)) {
      if (!isAsync(statement)) errors.push(`${fileName}: exported function ${statement.name?.text ?? '<anonymous>'} is not async`);
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      const immutable = Boolean(statement.declarationList.flags & ts.NodeFlags.Const);
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        const asyncFunctionValue = initializer
          && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
          && isAsync(initializer);
        if (!immutable) errors.push(`${fileName}: exported binding ${declaration.name.getText(sourceFile)} must be const`);
        else if (!asyncFunctionValue) errors.push(`${fileName}: exported runtime value ${declaration.name.getText(sourceFile)} is not an async function`);
      }
      continue;
    }
    errors.push(`${fileName}: unsupported runtime export ${ts.SyntaxKind[statement.kind]}`);
  }
  return errors;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function hasExportedAsyncFunction(sourceFile, exportName) {
  return sourceFile.statements.some((statement) =>
    ts.isFunctionDeclaration(statement)
    && statement.name?.text === exportName
    && isExported(statement)
    && isAsync(statement)
  );
}

const passingFixtures = [
  "'use server'; export type State = { ok: true }; export async function save() { return true; }",
  "'use server'; export interface State { ok: true }; export const save = async () => true;",
  "'use server'; export default async function save() { return true; }",
  "'use server'; export type { State } from './types';",
];
const failingFixtures = [
  ["object", "'use server'; export const value = { status: 'idle' };"],
  ["array", "'use server'; export const value = [];"],
  ["primitive", "'use server'; export const value = 1;"],
  ["class", "'use server'; export class Value {}"],
  ["enum", "'use server'; export enum Value { One }"],
  ["mutable binding", "'use server'; export let save = async () => true;"],
  ["sync function", "'use server'; export function save() { return true; }"],
  ["default object", "'use server'; export default { status: 'idle' };"],
  ["default sync function", "'use server'; export default function save() { return true; }"],
  ["runtime re-export", "'use server'; export { save } from './other';"],
];
const passingFixtureFailures = passingFixtures.flatMap((source, index) => validateUseServerSource(`passing-fixture-${index}.ts`, source));
const failingFixtureMisses = failingFixtures.filter(([name, source]) => validateUseServerSource(`failing-fixture-${name}.ts`, source).length === 0);
if (passingFixtureFailures.length !== 0 || failingFixtureMisses.length !== 0) {
  passingFixtureFailures.forEach((error) => console.error(`FAIL ${error}`));
  failingFixtureMisses.forEach(([name]) => console.error(`FAIL failing fixture was accepted: ${name}`));
  process.exit(1);
}

const errors = walk(appRoot).flatMap((absolute) => validateUseServerSource(path.relative(repositoryRoot, absolute), fs.readFileSync(absolute, 'utf8')));
for (const required of requiredCycle8ServerActions) {
  const absolute = path.join(repositoryRoot, required.file);
  if (!fs.existsSync(absolute)) {
    errors.push(`${required.file}: required Cycle 8 Server Action module is missing`);
    continue;
  }
  const source = fs.readFileSync(absolute, 'utf8');
  const sourceFile = ts.createSourceFile(required.file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (!hasExportedAsyncFunction(sourceFile, required.exportName)) {
    errors.push(`${required.file}: required Cycle 8 Server Action ${required.exportName} must remain an exported async function`);
  }
}
if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exit(1);
}

console.log(`PASS use-server modules export async functions only (${failingFixtures.length} prohibited fixtures rejected; ${requiredCycle8ServerActions.length} Cycle 8 actions bound)`);
