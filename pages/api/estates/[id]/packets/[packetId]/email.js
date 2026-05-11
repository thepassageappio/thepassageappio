import { loadContinuityPacketSet, packetForType, preparedPacketRecord } from '../../../../../../lib/continuityPacketApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const estateId = String(req.query.id || '').trim();
  const packetId = String(req.query.packetId || req.body?.type || '').trim();
  const dryRun = req.body?.dryRun !== false;
  const loaded = await loadContinuityPacketSet(req, estateId);
  if (loaded.error) return res.status(loaded.status || 500).json({ error: loaded.error });

  const packet = packetForType(loaded.packets, packetId);
  if (!packet) return res.status(404).json({ error: 'Packet not found.' });

  const record = preparedPacketRecord({
    estateId,
    packet,
    packetType: packetId || packet.id,
    user: loaded.user,
    context: loaded.context,
  });

  if (!dryRun) {
    return res.status(409).json({
      error: 'Live packet email is disabled in this environment. Use dryRun:true, preview, download, or print.',
      packet: record,
      safety: 'No email was sent.',
    });
  }

  return res.status(200).json({
    success: true,
    status: 'prepared',
    skipped: true,
    packet: record,
    emailPreview: {
      subject: `${packet.title} - prepared by Passage`,
      body: [
        'A Passage packet has been prepared for review.',
        'Review the attached/output text before sharing outside the family record.',
        '',
        packet.text,
      ].join('\n'),
    },
    safety: 'Dry run only. No email was sent.',
  });
}
