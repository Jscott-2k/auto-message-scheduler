const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

const WEBHOOKS_FILE = path.resolve('./webhooks.json');
const OUTPUT_FILE = path.resolve('./.github/workflows/scheduler.yml');

// Collect and convert all user-local times to UTC times
function getUniqueUtcTimes() {
  let webhooks;
  try {
    webhooks = JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8'));
  } catch (err) {
    console.error(`Error reading webhooks.json: ${err.message}`);
    process.exit(1);
  }

  const utcTimes = new Set();

  for (const user of webhooks) {
    if (!user.timezone || !user.schedules) continue;

    for (const sched of user.schedules) {
      const t = sched.time;
      if (!/^\d{2}:\d{2}$/.test(t)) continue;

      const [hour, minute] = t.split(':').map(Number);
      const local = DateTime.fromObject({ hour, minute }, { zone: user.timezone });
      const utc = local.toUTC();

      const utcHHMM = utc.toFormat('HH:mm');
      utcTimes.add(utcHHMM);
    }
  }

  return [...utcTimes].sort((a, b) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return ah !== bh ? ah - bh : am - bm;
  });
}

// Convert "HH:MM" to GitHub cron format
function timeToCron(t) {
  const [hh, mm] = t.split(':');
  return `${mm} ${hh} * * *`;
}

function generateYml(times) {
  return `name: Auto Message Scheduler

on:
  schedule:
${times.map(t => `    - cron: '${timeToCron(t)}'`).join('\n')}
  workflow_dispatch:

jobs:
  run-scheduler:
    runs-on: ubuntu-latest
    concurrency:
      group: scheduler
      cancel-in-progress: false

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install dependencies
      run: npm ci --omit=dev

    - name: Run scheduler
      run: node scheduler.js
`;
}

function main() {
  const times = getUniqueUtcTimes();
  if (times.length === 0) {
    console.error('No valid schedule times found in webhooks.json');
    process.exit(1);
  }

  const yml = generateYml(times);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, yml, 'utf8');

  console.log(`✅ Generated ${OUTPUT_FILE} with ${times.length} UTC times.`);
}

main();
