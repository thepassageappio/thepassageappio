export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, flow_type, name, executor_name, relationship } = req.body;

  console.log('🕊️ New Passage Lead:', {
    email,
    flow_type,
    name,
    executor_name,
    relationship,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({ success: true });
}
