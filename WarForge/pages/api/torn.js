/*
 * WARFORGE API PROXY
 * 
 * This file runs on Vercel's servers (not in the browser).
 * It receives requests from your WarForge frontend,
 * forwards them to the Torn API, and sends back the response.
 * 
 * This solves CORS because server-to-server calls are not blocked.
 * Same reason your Google Apps Script works — UrlFetchApp runs
 * on Google's servers, not in your browser.
 * 
 * Endpoints:
 *   GET /api/torn?type=war&id=39347&key=YOUR_KEY
 *   GET /api/torn?type=attacks&from=TIMESTAMP&to=TIMESTAMP&key=YOUR_KEY
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, id, key, from, to } = req.query;

  // Validate required params
  if (!key) {
    return res.status(400).json({ error: 'API key is required' });
  }
  if (!type) {
    return res.status(400).json({ error: 'Request type is required (war or attacks)' });
  }

  let tornUrl;

  switch (type) {
    case 'war':
      // Fetch ranked war report
      if (!id) {
        return res.status(400).json({ error: 'War ID is required' });
      }
      tornUrl = `https://api.torn.com/torn/${encodeURIComponent(id)}?selections=rankedwarreport&key=${encodeURIComponent(key)}`;
      break;

    case 'attacks':
      // Fetch faction attacks for a time range
      if (!from || !to) {
        return res.status(400).json({ error: 'from and to timestamps are required' });
      }
      tornUrl = `https://api.torn.com/faction/?selections=attacks&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&key=${encodeURIComponent(key)}`;
      break;

    default:
      return res.status(400).json({ error: 'Unknown type. Use "war" or "attacks"' });
  }

  try {
    const tornResponse = await fetch(tornUrl);
    const data = await tornResponse.json();

    // Pass through whatever Torn returns (including their error messages)
    return res.status(200).json(data);
  } catch (err) {
    console.error('Torn API proxy error:', err);
    return res.status(502).json({ 
      error: 'Failed to reach Torn API. The server may be down. Try again in a moment.' 
    });
  }
}
