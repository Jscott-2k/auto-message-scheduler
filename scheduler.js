#!/usr/bin/env node
// scheduler.js – run at a specific time passed as HH:MM
// Usage:   node scheduler.js 09:11

'use strict';

const fs = require('fs');
const { WebhookClient } = require('discord.js');

const now = new Date();
const scheduledTime = now.toISOString().slice(11, 16); // HH:MM UTC

// Load webhooks.json
let users;
try {
  users = JSON.parse(fs.readFileSync('./webhooks.json', 'utf8'));
} catch (err) {
  console.error('Could not read webhooks.json:', err.message);
  process.exit(1);
}

console.log(`Running scheduler for ${scheduledTime} UTC`);
let sent = 0;

// Send messages scheduled for this time
(async () => {
  for (const user of users) {
    const matches = (user.schedules || []).filter(s => s.time === scheduledTime);
    if (!matches.length) continue;

    const hook = new WebhookClient({ id: user.id, token: user.token });

    for (const { message } of matches) {
      try {
        await hook.send({
          content: message,
          username: user.username ?? undefined,
          avatarURL: user.avatarURL ?? undefined,
          allowedMentions: { parse: [] }
        });
        console.log(`Sent message for ${user.username} at ${scheduledTime}`);
        sent++;
      } catch (err) {
        console.error(`Failed to send for ${user.username}:`, err.message);
      }
    }

    hook.destroy();
  }

  if (!sent) console.log('No messages scheduled for this time.');
})();