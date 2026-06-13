exports.handler = async (event) => {
  if (!process.env.PENDO_KEY) {
    return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  }

  const headers = {
    'x-pendo-integration-key': process.env.PENDO_KEY,
    'content-type': 'application/json'
  };

  try {
    let visitorId = event.queryStringParameters?.visitorId || process.env.PENDO_DEMO_VISITOR_ID;

    // No fixed visitor configured: pick a random one from recently active visitors
    if (!visitorId) {
      const aggRes = await fetch('https://app.pendo.io/api/v1/aggregation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          response: { mimeType: 'application/json' },
          request: {
            pipeline: [
              {
                source: {
                  visitors: null,
                  timeSeries: { period: 'dayRange', first: 'now() - (30 * 24 * 60 * 60000)', count: 1 }
                }
              },
              { limit: 50 }
            ]
          }
        })
      });

      if (!aggRes.ok) {
        return { statusCode: aggRes.status, body: JSON.stringify({ error: `Pendo aggregation returned ${aggRes.status}` }) };
      }

      const aggData = await aggRes.json();
      const results = aggData?.results || [];

      if (results.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ error: 'No visitors found' }) };
      }

      visitorId = results[Math.floor(Math.random() * results.length)].visitorId;
    }

    const res = await fetch(`https://app.pendo.io/api/v1/visitor/${encodeURIComponent(visitorId)}`, { headers });

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: `Pendo API returned ${res.status}` }) };
    }

    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
