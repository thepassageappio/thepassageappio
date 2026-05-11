import { loadContinuityPacketSet, packetForType, preparedPacketRecord } from '../../../../lib/continuityPacketApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const estateId = String(req.query.id || '').trim();
  const packetType = String(req.body?.type || 'funeral_home_arrangement').trim();
  const loaded = await loadContinuityPacketSet(req, estateId);
  if (loaded.error) return res.status(loaded.status || 500).json({ error: loaded.error });

  const packet = packetForType(loaded.packets, packetType);
  if (!packet) return res.status(404).json({ error: 'No packet template is available for this case yet.' });

  const record = preparedPacketRecord({
    estateId,
    packet,
    packetType,
    user: loaded.user,
    context: loaded.context,
  });

  return res.status(200).json({
    source: loaded.source,
    workflow: loaded.workflow,
    packet: record,
    next: [
      'Preview the prepared output.',
      'Resolve any missing fields.',
      'Download or print only after coordinator approval.',
      'Save the reviewed output as task proof before closing the work.',
    ],
    safety: 'No email, SMS, or production document storage write occurred.',
  });
}
