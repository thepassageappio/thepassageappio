export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, flow_type, mode, timestamp } = req.body;

  console.log('🕊️ New Passage Lead:', {
    email,
    name,
    flow_type,
    mode,
    timestamp: timestamp || new Date().toISOString(),
  });

  return res.status(200).json({ success: true });
}
