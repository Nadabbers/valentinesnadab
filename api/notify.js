// Vercel Serverless Function: /api/notify
// Forwards RSVP notifications to an external webhook configured in the NOTIFY_WEBHOOK env var.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const webhook = process.env.NOTIFY_WEBHOOK;
  if (!webhook) {
    res.status(500).json({ error: 'NOTIFY_WEBHOOK not configured' });
    return;
  }

  let payload = {};
  try {
    payload = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await new Promise((r, j) => {
      let d = '';
      req.on('data', c => d += c);
      req.on('end', () => r(d));
      req.on('error', e => j(e));
    })) || {};
  } catch (e) {
    // ignore parse errors
    payload = {};
  }

  // Build a simple message – webhook consumers (Discord, Slack, IFTTT, Zapier) can handle JSON
  const message = {
    event: 'rsvp',
    choice: payload.choice || 'yes',
    time: payload.time || new Date().toISOString(),
    meta: {
      userAgent: req.headers['user-agent'] || null,
      ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
    }
  };
  // Helper: truncate strings to a safe length for embed fields
  function trunc(s, n = 1024) {
    if (!s && s !== 0) return 'Unknown';
    s = String(s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  // Detect Discord webhook URL and format payload as a Discord embed when possible
  const isDiscord = /discord(?:app)?\.com\/api\/webhooks/i.test(webhook);
  const sendBody = isDiscord ? JSON.stringify({
    username: 'Valentine Bot',
    embeds: [
      {
        title: `MIA SAID YES: ${String(message.choice).toUpperCase()}`,
        description: `Someone clicked **${trunc(message.choice, 256)}** on the invitation.`,
        fields: [
          { name: 'Time', value: trunc(message.time, 256), inline: true },
          { name: 'IP', value: trunc(message.meta.ip || 'Unknown', 256), inline: true },
          { name: 'User Agent', value: trunc(message.meta.userAgent || 'Unknown', 1024), inline: false }
        ],
        color: 16711935,
        timestamp: message.time
      }
    ]
  }) : JSON.stringify(message);

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: sendBody,
    });

    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'Webhook error', detail: text });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to POST to webhook', detail: String(err) });
  }
}
