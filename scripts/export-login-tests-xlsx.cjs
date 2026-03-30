/**
 * Generates docs/exports/Login_Test_Cases.xlsx from manual case definitions.
 * Run: npm run export:tests:xlsx
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rows = [
  {
    TestCaseID: 'LGN-001',
    Title: 'Valid Egypt login with 012 national number',
    Priority: 'High',
    Module: 'Login',
    Preconditions:
      'Staging available; user not logged in; default country Egypt (+20) or ability to select Egypt',
    TestData: 'Country: Egypt (+20); Phone: 1201644545; OTP: 8182',
    Steps:
      '1. Open login URL. 2. Ensure Egypt (+20) is selected. 3. Enter phone 1201644545. 4. Submit to request OTP. 5. Enter OTP 8182. 6. Verify OTP.',
    ExpectedResults:
      'OTP entry shown after valid phone. After valid OTP, redirect to /home or billing-blocked; user leaves login screen.',
    AutomationCoverage: 'Smoke, Regression',
    SpecFile: 'login.regression.spec.ts, login.smoke.spec.ts',
    AutomationTestName: 'valid Egypt login — LGN-001 012 (012) / valid Egypt login with 1201644545 and OTP 8182',
    Notes: 'Mirrors smoke coverage for 012 in smoke suite.',
  },
  {
    TestCaseID: 'LGN-002',
    Title: 'Valid Egypt login with 010 national number',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Same as LGN-001',
    TestData: 'Country: Egypt (+20); Phone: 1004505531; OTP: 8182',
    Steps: 'Same flow as LGN-001 with phone 1004505531.',
    ExpectedResults: 'Same as LGN-001 — successful post-login route.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'valid Egypt login — LGN-002 010 (010)',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-003',
    Title: 'Valid Egypt login with 011 national number',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Same as LGN-001',
    TestData: 'Country: Egypt (+20); Phone: 1118052239; OTP: 8182',
    Steps: 'Same flow as LGN-001 with phone 1118052239.',
    ExpectedResults: 'Same as LGN-001.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'valid Egypt login — LGN-003 011 (011)',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-004',
    Title: 'Valid Egypt login with 015 national number',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Same as LGN-001',
    TestData: 'Country: Egypt (+20); Phone: 1555558380; OTP: 8182',
    Steps: 'Same flow as LGN-001 with phone 1555558380.',
    ExpectedResults: 'Same as LGN-001.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'valid Egypt login — LGN-004 015 (015)',
    Notes: 'Skipped in automation unless E2E_ENABLE_EGYPT_015=1.',
  },
  {
    TestCaseID: 'LGN-005',
    Title: 'UAE-format number entered while Egypt (+20) remains selected',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Staging available; country left on Egypt',
    TestData: 'Country: Egypt; Phone: 507021238 (valid UAE number with wrong country)',
    Steps:
      '1. Open login URL. 2. Keep Egypt selected. 3. Enter 507021238. 4. Submit phone step.',
    ExpectedResults:
      'Validation error shown OR OTP step does not appear. User remains on login/auth route.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'UAE number entered while Egypt is still selected — validation or no OTP step',
    Notes: 'Uses invalidPhones.uaeNumberWhileEgyptSelected.',
  },
  {
    TestCaseID: 'LGN-006',
    Title: 'Valid UAE login when UAE (+971) is selected',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Staging available; valid UAE test mobile',
    TestData: 'Country: UAE (+971); Phone: 507021238; OTP: 2050',
    Steps:
      '1. Open login URL. 2. Select UAE (+971). 3. Enter 507021238. 4. Submit. 5. Enter OTP 2050. 6. Verify.',
    ExpectedResults: 'OTP step after valid phone. Successful login to /home or billing-blocked.',
    AutomationCoverage: 'Smoke',
    SpecFile: 'login.smoke.spec.ts',
    AutomationTestName: 'valid UAE login with 507021238 and OTP 2050',
    Notes: 'UAE OTP differs from Egypt (8182).',
  },
  {
    TestCaseID: 'LGN-007',
    Title: 'Invalid phone number format on Egypt selection',
    Priority: 'Medium',
    Module: 'Login',
    Preconditions: 'Staging available; Egypt selected',
    TestData: 'Malformed phone (e.g. letters) per product rules',
    Steps: '1. Open login URL. 2. Select Egypt. 3. Enter invalid phone.',
    ExpectedResults: 'Login disabled; OTP step does not appear.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'invalid phone number format — cannot submit, no OTP step',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-008',
    Title: 'Empty phone field',
    Priority: 'Medium',
    Module: 'Login',
    Preconditions: 'Staging available; Egypt selected',
    TestData: 'Phone: empty',
    Steps: '1. Open login URL. 2. Select Egypt. 3. Leave phone empty.',
    ExpectedResults: 'Login disabled; cannot reach OTP.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'empty phone — Login disabled, cannot reach OTP',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-009',
    Title: 'Invalid OTP after valid Egypt phone',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Valid Egypt phone reaches OTP step',
    TestData: 'Phone: 1201644545; wrong OTP: 9090 (automation)',
    Steps: '1. Complete phone with valid Egypt number. 2. Enter wrong OTP. 3. Submit.',
    ExpectedResults: 'Error visible; stay on OTP; no post-login URL.',
    AutomationCoverage: 'Smoke',
    SpecFile: 'login.smoke.spec.ts',
    AutomationTestName: 'invalid OTP after valid Egypt phone keeps user on OTP step',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-010',
    Title: 'Empty OTP submission',
    Priority: 'Medium',
    Module: 'Login',
    Preconditions: 'Valid phone reaches OTP step',
    TestData: 'Valid Egypt phone; OTP empty',
    Steps: '1. Reach OTP step. 2. Leave OTP empty. 3. Submit.',
    ExpectedResults: 'Validation visible; remain on OTP; no post-login.',
    AutomationCoverage: 'Regression',
    SpecFile: 'login.regression.spec.ts',
    AutomationTestName: 'empty OTP — required validation, remain on OTP step',
    Notes: '',
  },
  {
    TestCaseID: 'LGN-011',
    Title: 'Invalid OTP after valid UAE phone',
    Priority: 'High',
    Module: 'Login',
    Preconditions: 'Valid UAE phone reaches OTP step',
    TestData: 'Phone: 507021238; wrong OTP: 9090 (automation)',
    Steps:
      '1. Open login URL. 2. Select UAE. 3. Enter 507021238. 4. Submit. 5. Wrong OTP. 6. Submit.',
    ExpectedResults: 'Error visible; stay on OTP; no post-login.',
    AutomationCoverage: 'Smoke',
    SpecFile: 'login.smoke.spec.ts',
    AutomationTestName: 'invalid OTP after valid UAE phone keeps user on OTP step',
    Notes: 'Valid UAE OTP is 2050.',
  },
];

const playwrightRows = [
  { Suite: 'Regression', Tag: '@regression', TestTitle: 'valid Egypt login — LGN-001 012 (012)' },
  { Suite: 'Regression', Tag: '@regression', TestTitle: 'valid Egypt login — LGN-002 010 (010)' },
  { Suite: 'Regression', Tag: '@regression', TestTitle: 'valid Egypt login — LGN-003 011 (011)' },
  { Suite: 'Regression', Tag: '@regression', TestTitle: 'valid Egypt login — LGN-004 015 (015)' },
  {
    Suite: 'Regression',
    Tag: '@regression',
    TestTitle: 'UAE number entered while Egypt is still selected — validation or no OTP step',
  },
  {
    Suite: 'Regression',
    Tag: '@regression',
    TestTitle: 'invalid phone number format — cannot submit, no OTP step',
  },
  { Suite: 'Regression', Tag: '@regression', TestTitle: 'empty phone — Login disabled, cannot reach OTP' },
  {
    Suite: 'Regression',
    Tag: '@regression',
    TestTitle: 'empty OTP — required validation, remain on OTP step',
  },
  { Suite: 'Smoke', Tag: '@smoke', TestTitle: 'valid Egypt login with 1201644545 and OTP 8182' },
  { Suite: 'Smoke', Tag: '@smoke', TestTitle: 'valid UAE login with 507021238 and OTP 2050' },
  {
    Suite: 'Smoke',
    Tag: '@smoke',
    TestTitle: 'invalid OTP after valid Egypt phone keeps user on OTP step',
  },
  {
    Suite: 'Smoke',
    Tag: '@smoke',
    TestTitle: 'invalid OTP after valid UAE phone keeps user on OTP step',
  },
];

const outDir = path.join(__dirname, '..', 'docs', 'exports');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'Login_Test_Cases.xlsx');

const wb = XLSX.utils.book_new();
const wsManual = XLSX.utils.json_to_sheet(rows);
const wsPw = XLSX.utils.json_to_sheet(playwrightRows);
XLSX.utils.book_append_sheet(wb, wsManual, 'Manual_LGN_Cases');
XLSX.utils.book_append_sheet(wb, wsPw, 'Playwright_Tests');
XLSX.writeFile(wb, outFile);

console.log('Wrote', outFile);
