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

  try {
    // POST the message to the configured webhook
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
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
