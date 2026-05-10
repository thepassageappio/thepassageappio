export default function handler(req, res) {
  const csv = [
    [
      'source_system',
      'case_reference',
      'deceased_name',
      'primary_contact_name',
      'primary_contact_email',
      'primary_contact_phone',
      'total_case_value',
      'is_prepaid',
      'prepaid_amount',
      'date_of_death',
      'pronouncement_date',
      'release_date',
      'arrangement_date',
      'visitation_date',
      'funeral_date',
      'burial_date',
      'shiva_date',
      'reception_date',
      'obituary_deadline',
      'service_details',
      'notes',
    ].join(','),
    'Passare,CASE-001,Marian Ellis,Claire Ellis,claire@example.com,+18455550142,9800,no,,2026-04-29,2026-04-29,2026-04-30,2026-05-01,2026-05-02,2026-05-03,2026-05-03,,2026-05-03,2026-05-01,"Funeral Tuesday 10 AM; cemetery 1 PM","Needs obituary review"',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="passage-case-import-template.csv"');
  return res.status(200).send(csv);
}
