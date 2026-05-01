export default function handler(req, res) {
  const to = String(req.query.to || '').replace(/[^\d+]/g, '');
  const name = String(req.query.name || 'the provider').replace(/[<>&'"]/g, '');
  res.setHeader('Content-Type', 'text/xml');
  if (!to) {
    return res.status(200).send('<Response><Say>Passage could not find the provider phone number. Please return to the estate and try again.</Say></Response>');
  }
  return res.status(200).send(
    '<Response>' +
      '<Say>Passage is connecting your call to ' + name + ' now.</Say>' +
      '<Dial callerId="' + (process.env.TWILIO_PHONE_NUMBER || '') + '">' + to + '</Dial>' +
    '</Response>'
  );
}
