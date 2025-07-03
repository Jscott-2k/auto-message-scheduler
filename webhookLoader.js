const fs = require('fs');

function loadWebhooks() {
  try {
    const data = fs.readFileSync('./webhooks.json', 'utf8');
    const webhooks = JSON.parse(data);
    return webhooks;
  } catch (err) {
    console.error('Failed to load webhooks.json:', err.message);
    return [];
  }
}

module.exports = { loadWebhooks };