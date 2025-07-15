#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { WebhookClient } = require('discord.js');

function getHHMM(date) {
  return date.toISOString().slice(11, 16);
}

async function runScheduler() {
  const now = new Date();
  const window = new Set([
    getHHMM(now),
    getHHMM(new Date(now.getTime() - 60000)),
    getHHMM(new Date(now.getTime() - 120000))
  ]);

  let users;
  try {
    users = JSON.parse(fs.readFileSync('./webhooks.json', 'utf8'));
  } catch (err) {
    console.error('Could not read webhooks.json:', err.message);
    process.exit(1);
  }

  console.log(`Running scheduler for ${[...window].join(', ')} UTC`);
  let sent = 0;

  for (const user of users) {
    const matches = (user.schedules || []).filter(s => window.has(s.time));
    if (!matches.length) continue;

    const hook = new WebhookClient({ id: user.id, token: user.token });

    for (const { message } of matches) {
      try {
        await hook.send({
          content: message,
          username: user.username,
          avatarURL: user.avatarURL,
          allowedMentions: { parse: [] }
        });
        console.log(`Sent message for ${user.username || user.id} at ${current}`);
        sent++;
      } catch (err) {
        console.error(`Failed to send for ${user.username || user.id}:`, err.message);
      }
    }

    hook.destroy();
  }

  if (!sent) console.log('No messages scheduled in this window.');
}

runScheduler().catch(err => {
  console.error('Scheduler crashed:', err);
  process.exit(1);
});