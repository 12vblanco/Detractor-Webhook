exports.handler = async (event) => {
  const visitorId = event.queryStringParameters?.visitorId || process.env.PENDO_DEMO_VISITOR_ID;

  if (!process.env.PENDO_KEY || !visitorId) {
    return { statusCode: 200, body: JSON.stringify({ configured: false }) };
  }

  try {
    const res = await fetch(`https://app.pendo.io/api/v1/visitor/${encodeURIComponent(visitorId)}`, {
      headers: {
        'x-pendo-integration-key': process.env.PENDO_KEY,
        'content-type': 'application/json'
      }
    });

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: `Pendo API returned ${res.status}` }) };
    }

    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
