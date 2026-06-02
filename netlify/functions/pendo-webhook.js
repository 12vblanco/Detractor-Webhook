const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const score = parseInt(payload.answer);

    // Only process detractors (0-6)
    if (isNaN(score) || score > 6) {
      return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
    }

    const visitorId = payload.visitorId;

    // Call Pendo Visitor API
    const pendoRes = await fetch(`https://app.pendo.io/api/v1/visitor/${encodeURIComponent(visitorId)}`, {
      headers: {
        'x-pendo-integration-key': process.env.PENDO_KEY,
        'content-type': 'application/json'
      }
    });

    const visitorData = await pendoRes.json();

    const email = visitorData?.metadata?.auto?.email || visitorData?.metadata?.agent?.email || null;
    const name = visitorData?.metadata?.auto?.full_name || visitorData?.metadata?.agent?.full_name || null;

    // Write to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { error } = await supabase
      .from('detractors')
      .insert({
        visitor_id: visitorId,
        account_id: payload.accountId || null,
        email,
        name,
        score,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    console.log('Detractor saved:', { visitorId, email, name, score });

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};