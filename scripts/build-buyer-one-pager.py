"""Create the internal-review buyer one-pager from bounded evaluation claims."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/passage-authority-buyer-one-pager.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONTS = Path('C:/Windows/Fonts')
for name, file in [('Body', 'arial.ttf'), ('Bold', 'arialbd.ttf'), ('Display', 'georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / file)))
INK, GREEN, MUTED = HexColor('#17251f'), HexColor('#1b4d3e'), HexColor('#53635b')
c = canvas.Canvas(str(OUT), pagesize=(612, 792), pageCompression=1)
c.setTitle('Passage Authority | Buyer overview | Internal review draft')
c.setAuthor('Passage Authority')
c.setSubject('Fictional New York workflow evaluation for bank and credit union operations teams')

def text(value, x, top, width, size=11, leading=16, font='Body', color=INK):
    p = Paragraph(value, ParagraphStyle('copy', fontName=font, fontSize=size, leading=leading, textColor=color))
    _, height = p.wrap(width, 792)
    p.drawOn(c, x, top-height)
    return top-height

c.setFillColor(HexColor('#f5f3ed')); c.rect(0, 0, 612, 792, fill=1, stroke=0)
c.setFillColor(GREEN); c.rect(0, 780, 612, 12, fill=1, stroke=0)
c.saveState(); c.translate(54, 747); c.rotate(45); c.setStrokeColor(GREEN); c.setLineWidth(3)
c.roundRect(-7, -7, 14, 14, 3, fill=0, stroke=1)
c.roundRect(3, -7, 14, 14, 3, fill=0, stroke=1); c.restoreState()
text('Passage Authority', 83, 758, 310, 17, 21, 'Bold', GREEN)
text('FOR BANK AND CREDIT UNION OPERATIONS TEAMS', 44, 705, 524, 9, 13, 'Bold', GREEN)
text('From a request<br/>to a clear decision.', 44, 674, 524, 37, 43, 'Display')
text('When someone asks to help an account holder through a power of attorney, your team needs the right information and a clear record. Passage brings the request, review and decision into one place.', 44, 569, 508, 11.5, 17)

steps = [
    ('Prepare the request', 'Name the people, the account relationship and what help is requested.'),
    ('Collect the information', 'The account holder and representative each complete their own steps.'),
    ('Review and decide', 'Your team reviews the files, asks questions and records its decision.'),
    ('Share the decision', 'Each person can view a matching receipt with the accepted actions and limits.'),
]
for index, (title, body) in enumerate(steps):
    top = 497 - index * 55
    c.setStrokeColor(HexColor('#d5ddd5')); c.setLineWidth(0.5); c.line(44, top+8, 568, top+8)
    text(f'0{index+1}', 44, top-3, 32, 10, 14, 'Bold', GREEN)
    text(title, 91, top, 175, 12, 16, 'Bold')
    text(body, 279, top, 283, 10.5, 15)

c.setFillColor(HexColor('#e3ece5')); c.roundRect(44, 178, 524, 101, 12, fill=1, stroke=0)
text('Start with a small, fictional example', 61, 263, 487, 13, 17, 'Bold', GREEN)
text('The current New York evaluation covers two requests: getting copies of statements and discussing service issues. It uses fictional people and sample documents. Any pilot with customer data needs a separate review and approval.', 61, 237, 485, 10.5, 15)

text('Your institution stays in charge.', 44, 155, 524, 11, 15, 'Bold')
text('Your team makes the legal, identity, fraud and account-access decisions. Passage records the process and outcome; your institution makes any account changes in its own systems.', 44, 137, 524, 10, 14)

text('Where do these requests get stuck in your team?', 44, 82, 524, 13, 17, 'Bold', GREEN)
text('Start a conversation at thepassageapp.io/contact', 44, 61, 524, 10, 14, color=GREEN)
c.linkURL('https://thepassageapp.io/contact', (44, 46, 370, 62), relative=0, thickness=0)
text('INTERNAL REVIEW DRAFT  |  NOT CLEARED FOR DISTRIBUTION  |  11 SEP 2026', 44, 25, 524, 7, 9, color=MUTED)
c.showPage(); c.save()
print(OUT)
