exports.handler = async () => {
  if (!process.env.PENDO_KEY) {
    return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  }

  const headers = {
    'x-pendo-integration-key': process.env.PENDO_KEY,
    'content-type': 'application/json'
  };

  const sources = [
    { type: 'Guide', url: 'https://app.pendo.io/api/v1/guide' },
    { type: 'Feature', url: 'https://app.pendo.io/api/v1/feature' },
    { type: 'Segment', url: 'https://app.pendo.io/api/v1/segment' }
  ];

  try {
    const items = [];

    for (const { type, url } of sources) {
      const res = await fetch(url, { headers });

      if (!res.ok) {
        const detail = await res.text();
        console.error(`Pendo ${type} error:`, res.status, detail);
        return { statusCode: 200, body: JSON.stringify({ error: `Pendo ${type} list returned ${res.status}: ${detail}` }) };
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.guides || data?.features || data?.segments || []);

      for (const entry of list) {
        items.push({ type, name: entry.name, id: entry.id, createdAt: entry.createdAt });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ items }) };

  } catch (error) {
    return { statusCode: 200, body: JSON.stringify({ error: error.message }) };
  }
};
