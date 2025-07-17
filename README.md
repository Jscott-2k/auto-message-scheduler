Auto Message Scheduler

This project schedules and sends Discord webhook messages based on user-defined times submitted via a Google Form. It uses:

- Node.js for the scheduler logic  
- Discord webhooks to send messages  
- GitHub Actions for automatic scheduling and execution  

---

## Requirements

- [Node.js](https://nodejs.org/) (v20 or newer recommended)  
- A Discord server with permissions to create webhooks  
- GitHub Actions enabled in your GitHub repo  

---

## Install & Setup

### 1. Clone this repository

```bash
git clone https://github.com/your-username/auto-message-scheduler.git
cd auto-message-scheduler
```
### 2. Install dependencies

```bash
npm install
```
### 3. Add webhooks.json file

Create a webhooks.json file in the project root. This file contains an array of user webhook configurations with scheduled message times.

Each time is provided in the user's local timezone (e.g. America/New_York) and will be internally converted to UTC by the scheduler.
You do not need to manually convert anything to UTC.
### 4. (Optional) Collect user preferences with Google Form

To collect user input (e.g., timezone, preferred message time), you can use a Google Form linked to a Google Sheet. This isn't required for the app to work, but it helps automate gathering webhook data.
I use a Google Apps Script to convert form responses into the required webhooks.json format. This app script also is scheduled to run every 15 minutes and runs the `.github/workflows/update-webhooks-and-cron.yml` workflow.

---

## How Scheduling Works

GitHub Actions runs the scheduler using cron jobs defined in .github/workflows/scheduler.yml.

Each job runs at one or more specific UTC times and calls scheduler.js, which checks for any messages scheduled to be sent at that moment (± a few minutes).

You can automatically generate or update the cron schedule by running:

```bash
npm run generate-scheduler
```

This reads your webhooks.json and creates an updated .github/workflows/scheduler.yml based on all unique times.

To change or update the scheduled times:
1. Modify `webhooks.json` with updated times/messages.
2. Run `npm run generate-scheduler` to regenerate the cron schedule.
3. Commit and push the changes to GitHub.

GitHub Actions will now automatically send messages at those times.

---
### webhooks.json format

Each user entry should include:

- `id`: Discord webhook ID
- `token`: Discord webhook token
- `username` (optional): overrides the default webhook name
- `avatarURL` (optional): custom avatar for the message
- `timezone`: the user's IANA timezone (e.g., `"America/New_York"`)
- `schedules`: array of `{ time, message }` pairs. `time` should be in HH:MM 24-hour local time.

**Example:**

```json
[
  {
    "id": "123456789012345678",
    "token": "your_webhook_token_here",
    "username": "Auto Bot",
    "timezone": "America/New_York",
    "schedules": [
      { "time": "08:00", "message": "Good morning!" },
      { "time": "22:00", "message": "Good night!" }
    ]
  }
]

```

### Notes

- The scheduler checks for messages within a small ± window to allow for GitHub Actions delay.
- Duplicate message protection not implemented yet
- Messages are logged at runtime with timestamps and matching windows for debugging.
