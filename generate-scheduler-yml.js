const fs = require('fs');
const path = require('path');

const WEBHOOKS_FILE = path.resolve('./webhooks.json');
const OUTPUT_FILE = path.resolve('.github/workflows/scheduler.yml');

// Extract and sort unique HH:MM times from webhooks.json
function getUniqueTimes() {
  let webhooks;
  try {
    webhooks = JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8'));
  } catch (err) {
    console.error(`Error reading webhooks.json: ${err.message}`);
    process.exit(1);
  }

  const times = new Set();
  for (const user of webhooks) {
    for (const sched of user.schedules || []) {
      if (/^\d{2}:\d{2}$/.test(sched.time)) {
        times.add(sched.time);
      }
    }
  }

  return [...times].sort();
}

// Convert "HH:MM" to GitHub cron format
function timeToCron(t) {
  const [hh, mm] = t.split(':');
  return `    - cron: '${mm} ${hh} * * *'`;
}

// Generate scheduler.yml content
function generateYml(times) {
  return `name: Auto Message Scheduler

on:
  schedule:
${times.map(timeToCron).join('\n')}
  workflow_dispatch:

jobs:
  run-scheduler:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install dependencies
      run: npm ci --omit=dev

    - name: Install gdown
      run: pip install --no-cache-dir gdown

    - name: Download webhooks.json
      run: |
        gdown --id 12RANwESLxYGsxT53SbHVK4XmjOcWipYI --no-cookies --output webhooks.json

    - name: Run scheduler
      run: node scheduler.js
`;
}

function main() {
  const times = getUniqueTimes();
  const yml = generateYml(times);

  // Ensure directory exists
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, yml);
  console.log(`Generated ${OUTPUT_FILE} with ${times.length} scheduled times.`);
}

main();
