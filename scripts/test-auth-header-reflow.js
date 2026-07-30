#!/usr/bin/env node

const fs = require('node:fs');

const css = fs.readFileSync('app/login/Auth.module.css', 'utf8');
const loginPage = fs.readFileSync('app/login/page.tsx', 'utf8');
const invitationPage = fs.readFileSync('app/invite/[token]/page.tsx', 'utf8');

const checks = [
  ['shared auth header can wrap', /\.brandBar\s*\{[^}]*flex-wrap:\s*wrap\s*;/s.test(css)],
  ['environment label can shrink inside the header', /\.brandBar span\s*\{[^}]*min-width:\s*0\s*;/s.test(css)],
  ['environment label stays inside the header width', /\.brandBar span\s*\{[^}]*max-width:\s*100%\s*;/s.test(css)],
  ['long environment words can reflow', /\.brandBar span\s*\{[^}]*overflow-wrap:\s*anywhere\s*;/s.test(css)],
  ['mobile header reserves wrapped-line height', /@media \(max-width:\s*480px\)[^{]*\{[\s\S]*?\.brandBar\s*\{[^}]*padding-block:\s*8px\s*;/s.test(css)],
  ['login still uses the shared auth header', /className=\{styles\.brandBar\}/.test(loginPage)],
  ['invitation inspection still uses the shared auth header', /className=\{styles\.brandBar\}/.test(invitationPage)],
];

let failures = 0;
for (const [label, passed] of checks) {
  if (passed) {
    console.log(`ok - ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL - ${label}`);
  }
}

if (failures) process.exit(1);
console.log(`PASS auth header reflow regression (${checks.length}/${checks.length})`);
