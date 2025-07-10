const fs = require('fs');
const path = require('path');

const WEBHOOKS_FILE = path.resolve('./webhooks.json');
const OUTPUT_FILE = path.resolve('./.cron-times.txt');

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

// Convert "HH:MM" to GitHub cron format string (MM HH * * *)
function timeToCron(t) {
  const [hh, mm] = t.split(':');
  return `${mm} ${hh} * * *`;
}

function main() {
  const times = getUniqueTimes();
  const cronLines = times.map(timeToCron).join('\n');
  fs.writeFileSync(OUTPUT_FILE, cronLines, 'utf8');
  console.log(`Wrote ${times.length} cron lines to ${OUTPUT_FILE}`);
}

main();