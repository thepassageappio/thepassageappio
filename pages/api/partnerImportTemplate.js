export default function handler(req, res) {
  const csv = [
    'deceased_name,primary_contact_name,primary_contact_email,phone,date_of_death,case_reference,service_details,notes',
    'Marian Ellis,Claire Ellis,claire@example.com,+18455550142,2026-04-29,CASE-001,"Funeral Tuesday 10 AM; cemetery 1 PM","Needs obituary review"',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="passage-case-import-template.csv"');
  return res.status(200).send(csv);
}
