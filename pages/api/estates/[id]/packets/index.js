import { loadContinuityPacketSet, preparedPacketRecord } from '../../../../../lib/continuityPacketApi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const estateId = String(req.query.id || '').trim();
  const loaded = await loadContinuityPacketSet(req, estateId);
  if (loaded.error) return res.status(loaded.status || 500).json({ error: loaded.error });

  return res.status(200).json({
    source: loaded.source,
    workflow: loaded.workflow,
    context: loaded.context,
    packets: loaded.packets.map(packet => preparedPacketRecord({
      estateId,
      packet,
      packetType: packet.id,
      user: loaded.user,
      context: loaded.context,
    })),
    safety: 'Prepared packet list only. Nothing was sent.',
  });
}
