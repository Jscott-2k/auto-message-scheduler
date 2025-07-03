const fs = require('fs');
const path = require('path');

const WEBHOOKS_FILE = path.resolve('./webhooks.json');
const BASE_FLY_TOML = path.resolve('./fly.base.toml');
const OUTPUT_FLY_TOML = path.resolve('./fly.toml');

// Format a time string (HH:MM) into a Fly cron schedule line
function timeToCron(timeStr) {
  const [hour, minute] = timeStr.split(':');
  return `${minute} ${hour} * * *`;
}

// Generate one cron block for fly.toml
function generateCronBlock(timeStr) {
  return `[[cron]]
schedule = "${timeToCron(timeStr)}"
command = "node scheduler.js ${timeStr}"`;
}

function main() {
  let webhooks;
  try {
    webhooks = JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8'));
  } catch (e) {
    console.error(`Failed to read ${WEBHOOKS_FILE}:`, e.message);
    process.exit(1);
  }

  // Extract all unique times
  const times = new Set();
  for (const user of webhooks) {
    if (!user.schedules) continue;
    for (const sched of user.schedules) {
      if (/^\d{2}:\d{2}$/.test(sched.time)) {
        times.add(sched.time);
      }
    }
  }

  const sortedTimes = [...times].sort();

  // Read base fly.toml
  let baseConfig = '';
  try {
    baseConfig = fs.readFileSync(BASE_FLY_TOML, 'utf8');
  } catch (e) {
    console.error(`Failed to read ${BASE_FLY_TOML}:`, e.message);
    process.exit(1);
  }

  // Generate cron blocks
  const cronBlocks = sortedTimes.map(generateCronBlock).join('\n\n');

  // Combine base config and cron blocks
  const newFlyToml = `${baseConfig.trim()}\n\n${cronBlocks}\n`;

  // Write output file
  fs.writeFileSync(OUTPUT_FLY_TOML, newFlyToml, 'utf8');
  console.log(`fly.toml generated with ${sortedTimes.length} cron entries.`);
}

main();