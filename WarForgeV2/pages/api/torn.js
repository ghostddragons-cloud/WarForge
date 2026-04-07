/*
 * WARFORGE API PROXY
 * 
 * Endpoints:
 *   GET /api/torn?type=war&id=39347&key=KEY           → ranked war report
 *   GET /api/torn?type=attacks&from=TS&to=TS&key=KEY   → attack log
 *   GET /api/torn?type=ranked_wars&key=KEY             → faction's active/recent ranked wars
 *   GET /api/torn?type=faction_basic&key=KEY            → faction basic info
 *   GET /api/torn?type=faction_basic_id&id=ID&key=KEY   → other faction basic info
 *   GET /api/torn?type=live_attacks&from=TS&key=KEY     → attacks from timestamp to now
 *   GET /api/torn?type=personalstats&id=UID&key=KEY     → user's personal stats
 *   GET /api/torn?type=user_profile&id=UID&key=KEY      → user's basic profile
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, id, key, from, to } = req.query;

  if (!key) return res.status(400).json({ error: 'API key is required' });
  if (!type) return res.status(400).json({ error: 'Request type is required' });

  let tornUrl;

  switch (type) {
    case 'war':
      if (!id) return res.status(400).json({ error: 'War ID is required' });
      tornUrl = `https://api.torn.com/torn/${encodeURIComponent(id)}?selections=rankedwarreport&key=${encodeURIComponent(key)}`;
      break;

    case 'attacks':
      if (!from || !to) return res.status(400).json({ error: 'from and to timestamps required' });
      tornUrl = `https://api.torn.com/faction/?selections=attacks&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&key=${encodeURIComponent(key)}`;
      break;

    case 'ranked_wars':
      tornUrl = `https://api.torn.com/faction/?selections=rankedwars&key=${encodeURIComponent(key)}`;
      break;

    case 'faction_basic':
      tornUrl = `https://api.torn.com/faction/?selections=basic&key=${encodeURIComponent(key)}`;
      break;

    case 'faction_basic_id':
      if (!id) return res.status(400).json({ error: 'Faction ID is required' });
      tornUrl = `https://api.torn.com/faction/${encodeURIComponent(id)}?selections=basic&key=${encodeURIComponent(key)}`;
      break;

    case 'live_attacks':
      if (!from) return res.status(400).json({ error: 'from timestamp required' });
      tornUrl = `https://api.torn.com/faction/?selections=attacks&from=${encodeURIComponent(from)}&key=${encodeURIComponent(key)}`;
      break;

    case 'personalstats':
      if (!id) return res.status(400).json({ error: 'User ID is required' });
      tornUrl = `https://api.torn.com/user/${encodeURIComponent(id)}?selections=personalstats&key=${encodeURIComponent(key)}`;
      break;

    case 'user_profile':
      if (!id) return res.status(400).json({ error: 'User ID is required' });
      tornUrl = `https://api.torn.com/user/${encodeURIComponent(id)}?selections=profile&key=${encodeURIComponent(key)}`;
      break;

    case 'faction_chains':
      tornUrl = `https://api.torn.com/faction/?selections=chains&key=${encodeURIComponent(key)}`;
      break;

    case 'chain_report':
      if (!id) return res.status(400).json({ error: 'Chain ID is required' });
      tornUrl = `https://api.torn.com/torn/${encodeURIComponent(id)}?selections=chainreport&key=${encodeURIComponent(key)}`;
      break;

    default:
      return res.status(400).json({ error: 'Unknown type' });
  }

  try {
    const tornResponse = await fetch(tornUrl);
    const data = await tornResponse.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Torn API proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach Torn API. Try again in a moment.' });
  }
}
