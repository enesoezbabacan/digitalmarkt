"""
Erzeugt den Steuerfristen-Kalender 2026/2027 als PDF.

Verkaufsprodukt. Zielgruppe: Selbstständige, die Fristen verpassen und dann
Verspätungszuschläge zahlen.

Kern: Die Fristen stehen verstreut in Gesetzen und auf Behördenseiten. Hier
sind sie auf einer Seite, chronologisch, mit der Angabe wen sie betreffen und
was passiert, wenn man sie verpasst.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

DUNKEL = colors.HexColor("#1F3864")
HELL = colors.HexColor("#D9E2F3")
GRAU = colors.HexColor("#595959")
GELB = colors.HexColor("#FFF2CC")
ROT = colors.HexColor("#C00000")

TITEL = "Steuerfristen 2026 / 2027"
UNTERTITEL = "Der Fristenkalender für Selbstständige und Kleinunternehmer"

stile = getSampleStyleSheet()
S = {
    "titel": ParagraphStyle("t", parent=stile["Title"], fontName="Helvetica-Bold",
                            fontSize=25, leading=30, textColor=DUNKEL,
                            alignment=TA_LEFT, spaceAfter=4),
    "unter": ParagraphStyle("u", parent=stile["Normal"], fontName="Helvetica",
                            fontSize=13, leading=17, textColor=GRAU, spaceAfter=16),
    "h1": ParagraphStyle("h1", parent=stile["Heading1"], fontName="Helvetica-Bold",
                         fontSize=15, leading=19, textColor=DUNKEL,
                         spaceBefore=13, spaceAfter=7),
    "h2": ParagraphStyle("h2", parent=stile["Heading2"], fontName="Helvetica-Bold",
                         fontSize=11.5, leading=15, textColor=DUNKEL,
                         spaceBefore=9, spaceAfter=4),
    "text": ParagraphStyle("p", parent=stile["Normal"], fontName="Helvetica",
                           fontSize=10, leading=14, spaceAfter=6),
    "zelle": ParagraphStyle("z", parent=stile["Normal"], fontName="Helvetica",
                            fontSize=8.5, leading=11.5),
    "zellef": ParagraphStyle("zf", parent=stile["Normal"], fontName="Helvetica-Bold",
                             fontSize=8.5, leading=11.5),
}


def kopf_fuss(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GRAU)
    canvas.drawString(20 * mm, 12 * mm, TITEL)
    canvas.drawRightString(190 * mm, 12 * mm, f"Seite {doc.page}")
    canvas.setStrokeColor(HELL)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 15 * mm, 190 * mm, 15 * mm)
    canvas.restoreState()


def kasten(text, farbe=GELB, rahmen="#D6B656"):
    t = Table([[Paragraph(text, S["zelle"])]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), farbe),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor(rahmen)),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def kaestchen():
    k = Table([[""]], colWidths=[4 * mm], rowHeights=[4 * mm])
    k.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, DUNKEL),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return k


def fristen_tabelle(zeilen):
    daten = [[
        Paragraph("<b>ok</b>", S["zellef"]),
        Paragraph("<b>Termin</b>", S["zellef"]),
        Paragraph("<b>Was fällig ist</b>", S["zellef"]),
        Paragraph("<b>Wen es betrifft</b>", S["zellef"]),
    ]]
    for termin, was, wen in zeilen:
        daten.append([
            kaestchen(),
            Paragraph(termin, S["zelle"]),
            Paragraph(was, S["zelle"]),
            Paragraph(wen, S["zelle"]),
        ])
    t = Table(daten, colWidths=[10 * mm, 32 * mm, 72 * mm, 56 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DUNKEL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFBFBF")),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FC")]),
    ]))
    return t


UST_M = "Umsatzsteuer-Voranmeldung (monatlich)"
UST_Q = "Umsatzsteuer-Voranmeldung (Quartal)"
REGEL = "nur Regelbesteuerung"
REGEL_Q = "Regelbesteuerung, quartalsweise"
REGEL_M = "Regelbesteuerung, monatlich"

I = []
A = I.append

A(Spacer(1, 22 * mm))
A(Paragraph(TITEL, S["titel"]))
A(Paragraph(UNTERTITEL, S["unter"]))
A(Paragraph(
    "Verpasste Fristen kosten Geld — Verspätungszuschläge betragen bis zu "
    "10 % der festgesetzten Steuer, bei der Umsatzsteuer-Voranmeldung "
    "zusätzlich 1 % Säumniszuschlag je angefangenem Monat. Beides lässt sich "
    "vollständig vermeiden, wenn man die Termine kennt.",
    S["text"]))
A(Spacer(1, 4 * mm))
A(kasten(
    "<b>Als Kleinunternehmer nach § 19 UStG</b> entfallen die "
    "Umsatzsteuer-Voranmeldungen komplett. Für dich sind nur die Jahrestermine "
    "relevant — das sind die Zeilen ohne den Zusatz „Regelbesteuerung“."))
A(Spacer(1, 6 * mm))

A(Paragraph("Die Dauerfristverlängerung", S["h2"]))
A(Paragraph(
    "Wer regelmäßig Umsatzsteuer-Voranmeldungen abgibt, kann eine "
    "Dauerfristverlängerung beantragen. Damit verschieben sich alle "
    "Voranmeldungen um einen Monat nach hinten. Bei monatlicher Abgabe ist "
    "dafür eine Sondervorauszahlung von 1/11 der Vorjahressumme fällig; bei "
    "quartalsweiser Abgabe nicht. Der Antrag läuft über ELSTER und gilt, bis "
    "man ihn widerruft.",
    S["text"]))
A(PageBreak())

A(Paragraph("2026 — Jahresübersicht", S["h1"]))
A(fristen_tabelle([
    ("10. Januar", UST_M + " für Dezember 2025", REGEL_M),
    ("10. Januar", UST_Q + " für Q4 2025", REGEL_Q),
    ("10. Februar", UST_M + " für Januar", REGEL_M),
    ("10. Februar", "Antrag auf Dauerfristverlängerung für 2026", REGEL),
    ("10. März", UST_M + " für Februar", REGEL_M),
    ("31. März", "Jahresmeldung zur Künstlersozialabgabe", "wer Künstler oder Publizisten beauftragt"),
    ("10. April", UST_M + " für März", REGEL_M),
    ("10. April", UST_Q + " für Q1", REGEL_Q),
    ("10. Mai", UST_M + " für April", REGEL_M),
    ("10. Juni", UST_M + " für Mai", REGEL_M),
    ("10. Juli", UST_M + " für Juni", REGEL_M),
    ("10. Juli", UST_Q + " für Q2", REGEL_Q),
    ("<b>31. Juli</b>", "<b>Einkommensteuererklärung 2025 inkl. Anlage EÜR</b>", "<b>alle</b>"),
    ("<b>31. Juli</b>", "<b>Umsatzsteuer-Jahreserklärung 2025</b>", "<b>alle, auch Kleinunternehmer</b>"),
    ("<b>31. Juli</b>", "<b>Gewerbesteuererklärung 2025</b>", "<b>ab 24.500 € Gewerbeertrag</b>"),
    ("10. August", UST_M + " für Juli", REGEL_M),
    ("10. September", UST_M + " für August", REGEL_M),
    ("10. Oktober", UST_M + " für September", REGEL_M),
    ("10. Oktober", UST_Q + " für Q3", REGEL_Q),
    ("10. November", UST_M + " für Oktober", REGEL_M),
    ("10. Dezember", UST_M + " für November", REGEL_M),
    ("31. Dezember", "Inventur zum Jahresabschluss", "bilanzierungspflichtige Betriebe"),
]))
A(PageBreak())

A(Paragraph("2027 — Jahresübersicht", S["h1"]))
A(fristen_tabelle([
    ("11. Januar", UST_M + " für Dezember 2026", REGEL_M),
    ("11. Januar", UST_Q + " für Q4 2026", REGEL_Q),
    ("10. Februar", UST_M + " für Januar", REGEL_M),
    ("10. Februar", "Antrag auf Dauerfristverlängerung für 2027", REGEL),
    ("10. März", UST_M + " für Februar", REGEL_M),
    ("31. März", "Jahresmeldung zur Künstlersozialabgabe", "wer Künstler oder Publizisten beauftragt"),
    ("12. April", UST_M + " für März", REGEL_M),
    ("12. April", UST_Q + " für Q1", REGEL_Q),
    ("10. Mai", UST_M + " für April", REGEL_M),
    ("10. Juni", UST_M + " für Mai", REGEL_M),
    ("12. Juli", UST_M + " für Juni", REGEL_M),
    ("12. Juli", UST_Q + " für Q2", REGEL_Q),
    ("<b>2. August</b>", "<b>Einkommensteuererklärung 2026 inkl. Anlage EÜR</b>", "<b>alle</b>"),
    ("<b>2. August</b>", "<b>Umsatzsteuer-Jahreserklärung 2026</b>", "<b>alle, auch Kleinunternehmer</b>"),
    ("<b>2. August</b>", "<b>Gewerbesteuererklärung 2026</b>", "<b>ab 24.500 € Gewerbeertrag</b>"),
    ("10. August", UST_M + " für Juli", REGEL_M),
    ("10. September", UST_M + " für August", REGEL_M),
    ("11. Oktober", UST_M + " für September", REGEL_M),
    ("11. Oktober", UST_Q + " für Q3", REGEL_Q),
    ("10. November", UST_M + " für Oktober", REGEL_M),
    ("10. Dezember", UST_M + " für November", REGEL_M),
]))
A(Spacer(1, 4 * mm))
A(Paragraph(
    "Fällt ein Termin auf ein Wochenende oder einen Feiertag, verschiebt er "
    "sich auf den nächsten Werktag. Das ist der Grund für die abweichenden "
    "Daten 2027.",
    S["text"]))
A(PageBreak())

A(Paragraph("Was passiert, wenn du eine Frist verpasst", S["h1"]))
A(Paragraph(
    "Die Höhe hängt davon ab, welche Frist und wie lange.",
    S["text"]))

daten = [
    [Paragraph("<b>Fall</b>", S["zellef"]),
     Paragraph("<b>Folge</b>", S["zellef"]),
     Paragraph("<b>Höhe</b>", S["zellef"])],
    [Paragraph("Voranmeldung zu spät abgegeben", S["zelle"]),
     Paragraph("Verspätungszuschlag", S["zelle"]),
     Paragraph("bis 10 % der Steuer, höchstens 25.000 €", S["zelle"])],
    [Paragraph("Steuer zu spät gezahlt", S["zelle"]),
     Paragraph("Säumniszuschlag", S["zelle"]),
     Paragraph("1 % je angefangenem Monat", S["zelle"])],
    [Paragraph("Jahreserklärung zu spät", S["zelle"]),
     Paragraph("Verspätungszuschlag", S["zelle"]),
     Paragraph("mindestens 25 € je angefangenem Monat", S["zelle"])],
    [Paragraph("Erklärung gar nicht abgegeben", S["zelle"]),
     Paragraph("Schätzung durch das Finanzamt", S["zelle"]),
     Paragraph("fällt fast immer zu deinen Ungunsten aus", S["zelle"])],
    [Paragraph("Wiederholt verspätet", S["zelle"]),
     Paragraph("Zwangsgeld", S["zelle"]),
     Paragraph("im Einzelfall festgesetzt", S["zelle"])],
]
t = Table(daten, colWidths=[56 * mm, 52 * mm, 62 * mm])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), DUNKEL),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFBFBF")),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FC")]),
]))
A(t)

A(Spacer(1, 6 * mm))
A(Paragraph("Fristverlängerung beantragen", S["h2"]))
A(Paragraph(
    "Wenn du merkst, dass du eine Frist nicht hältst: Beantrage vorher eine "
    "Verlängerung, statt sie verstreichen zu lassen. Ein formloser Antrag über "
    "ELSTER oder schriftlich beim Finanzamt reicht meist. Wird er vor Fristablauf "
    "gestellt und begründet, wird er in der Regel gewährt — danach nicht mehr.",
    S["text"]))
A(Spacer(1, 4 * mm))
A(Paragraph("Wer einen Steuerberater beauftragt", S["h2"]))
A(Paragraph(
    "Dann verlängert sich die Abgabefrist für die Jahreserklärungen erheblich — "
    "regelmäßig bis Ende Februar des übernächsten Jahres. Für die Erklärung 2025 "
    "also bis Ende Februar 2027. Die Voranmeldungen bleiben davon unberührt.",
    S["text"]))

A(Spacer(1, 8 * mm))
A(kasten(
    "Dieser Kalender ist eine Arbeitshilfe und ersetzt keine Steuerberatung. "
    "Die Termine gelten für den Regelfall; im Einzelfall können abweichende "
    "Fristen greifen. Prüfe die Angaben vor jeder Abgabe. "
    "Rechtsstand: August 2026.",
    farbe=colors.HexColor("#FCE4E4"), rahmen="#C00000"))

doc = BaseDocTemplate(
    "Steuerfristen-Kalender-2026-2027.pdf", pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm,
    topMargin=18 * mm, bottomMargin=20 * mm,
    title=TITEL, subject=UNTERTITEL,
)
rahmen = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="n")
doc.addPageTemplates([PageTemplate(id="s", frames=rahmen, onPage=kopf_fuss)])
doc.build(I)
print("gespeichert")
