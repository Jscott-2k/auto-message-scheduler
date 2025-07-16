#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { WebhookClient } = require("discord.js");
const { DateTime } = require("luxon");

function logError(user, err) {
  console.error(`Failed to send for ${user.username || user.id}:`, err.message);
}

async function runScheduler() {
  let users;
  try {
    users = JSON.parse(fs.readFileSync("./webhooks.json", "utf8"));
  } catch (err) {
    console.error("Could not read webhooks.json:", err.message);
    process.exit(1);
  }

  let sent = 0;

  for (const user of users) {
    if (!user.timezone) {
      console.error(`User ${user.username || user.id} missing timezone`);
      continue;
    }

    const nowUtc = DateTime.utc();
    const nowLocal = nowUtc.setZone(user.timezone);
    
    // Build UTC window from nowUtc -5 to +5 minutes (already in UTC)
    const window = new Set(
      Array.from({ length: 11 }, (_, i) =>
        nowUtc.minus({ minutes: 5 }).plus({ minutes: i }).toFormat("HH:mm")
      )
    );

    console.log(
      `Running scheduler for ${
        user.username || user.id
      } — Local time: ${nowLocal.toFormat("HH:mm")} — UTC window: ${[
        ...window,
      ].join(", ")}`
    );

    // Convert each scheduled time from user timezone to UTC string 'HH:mm'
    const schedulesInUtc = (user.schedules || []).map((s) => {
      const dt = DateTime.fromFormat(s.time, "HH:mm", { zone: user.timezone });
      return { time: dt.toUTC().toFormat("HH:mm"), message: s.message };
    });

    // Find matches based on converted UTC times
    const matches = schedulesInUtc.filter((s) => window.has(s.time));
    if (!matches.length) continue;

    const hook = new WebhookClient({ id: user.id, token: user.token });

    for (const { message } of matches) {
      try {
        await hook.send({
          content: message,
          username: user.username,
          avatarURL: user.avatarURL,
          allowedMentions: { parse: [] },
        });
        console.log(
          `Sent message for ${user.username || user.id} at ${nowUtc.toISO()}`
        );
        sent++;
      } catch (err) {
        logError(user, err);
      }
    }

    try {
      hook.destroy();
    } catch (err) {
      console.error(
        `Failed to destroy hook for ${user.username || user.id}:`,
        err.message
      );
    }
  }

  if (!sent) console.log("No messages scheduled in this window.");
}

runScheduler().catch((err) => {
  console.error("Scheduler crashed:", err);
  process.exit(1);
});
