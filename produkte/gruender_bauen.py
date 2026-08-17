"""
Erzeugt die Gründer-Checkliste als PDF.

Verkaufsprodukt für den Marktplatz. Zielgruppe: Menschen, die in Deutschland
ein Kleingewerbe oder eine selbstständige Tätigkeit anmelden wollen und nicht
wissen, in welcher Reihenfolge was zu tun ist.

Der Kern des Produkts ist die REIHENFOLGE. Die einzelnen Informationen findet
man verstreut im Netz — was fehlt, ist ein Ablaufplan, der sagt: erst das,
dann das, und darauf musst du warten.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

DUNKEL = colors.HexColor("#1F3864")
HELL = colors.HexColor("#D9E2F3")
GRAU = colors.HexColor("#595959")
ROT = colors.HexColor("#C00000")
GELB = colors.HexColor("#FFF2CC")

TITEL = "In 14 Tagen selbstständig"
UNTERTITEL = "Die Gründer-Checkliste für Kleingewerbe und Freiberufler"

stile = getSampleStyleSheet()

S = {
    "titel": ParagraphStyle(
        "titel", parent=stile["Title"], fontName="Helvetica-Bold",
        fontSize=26, leading=31, textColor=DUNKEL, alignment=TA_LEFT, spaceAfter=4,
    ),
    "untertitel": ParagraphStyle(
        "untertitel", parent=stile["Normal"], fontName="Helvetica",
        fontSize=13, leading=17, textColor=GRAU, spaceAfter=18,
    ),
    "h1": ParagraphStyle(
        "h1", parent=stile["Heading1"], fontName="Helvetica-Bold",
        fontSize=16, leading=20, textColor=DUNKEL, spaceBefore=16, spaceAfter=8,
    ),
    "h2": ParagraphStyle(
        "h2", parent=stile["Heading2"], fontName="Helvetica-Bold",
        fontSize=12, leading=15, textColor=DUNKEL, spaceBefore=10, spaceAfter=5,
    ),
    "text": ParagraphStyle(
        "text", parent=stile["Normal"], fontName="Helvetica",
        fontSize=10, leading=14.5, spaceAfter=6,
    ),
    "klein": ParagraphStyle(
        "klein", parent=stile["Normal"], fontName="Helvetica",
        fontSize=8.5, leading=12, textColor=GRAU, spaceAfter=4,
    ),
    "warnung": ParagraphStyle(
        "warnung", parent=stile["Normal"], fontName="Helvetica-Bold",
        fontSize=9.5, leading=13.5, textColor=ROT, spaceAfter=6,
    ),
    "zelle": ParagraphStyle(
        "zelle", parent=stile["Normal"], fontName="Helvetica",
        fontSize=9, leading=12.5,
    ),
    "zelle_fett": ParagraphStyle(
        "zelle_fett", parent=stile["Normal"], fontName="Helvetica-Bold",
        fontSize=9, leading=12.5,
    ),
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


def kaestchen():
    """
    Echtes Ankreuz-Kästchen als gezeichnetes Rechteck.

    Bewusst KEIN Unicode-Zeichen wie ☐: Die Standardschriften eines PDF
    (Helvetica, Times) enthalten dieses Glyph nicht. Im Druck erscheint dann
    ein leerer Fleck — bei einer Checkliste zum Abhaken der schlimmste Fall.
    """
    k = Table([[""]], colWidths=[4.5 * mm], rowHeights=[4.5 * mm])
    k.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, DUNKEL),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return k


def schritt_tabelle(zeilen):
    """Tabelle mit Kästchen zum Abhaken."""
    daten = [[
        Paragraph("<b>erledigt</b>", S["zelle"]),
        Paragraph("<b>Aufgabe</b>", S["zelle"]),
        Paragraph("<b>Wo / Wie</b>", S["zelle"]),
    ]]
    for aufgabe, wo in zeilen:
        daten.append([
            kaestchen(),
            Paragraph(aufgabe, S["zelle"]),
            Paragraph(wo, S["zelle"]),
        ])

    t = Table(daten, colWidths=[16 * mm, 78 * mm, 76 * mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DUNKEL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFBFBF")),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FC")]),
    ]))
    return t


def hinweis(text):
    t = Table([[Paragraph(text, S["zelle"])]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GELB),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D6B656")),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


inhalt = []
A = inhalt.append

# --- Titelseite ---------------------------------------------------------
A(Spacer(1, 30 * mm))
A(Paragraph(TITEL, S["titel"]))
A(Paragraph(UNTERTITEL, S["untertitel"]))
A(Spacer(1, 6 * mm))
A(Paragraph(
    "Diese Checkliste führt dich in der richtigen Reihenfolge durch deine "
    "Gründung. Der Inhalt ist nicht das Schwierige — die Reihenfolge ist es. "
    "Wer das Gewerbe anmeldet, bevor er die Rechtsform geklärt hat, oder wer "
    "auf die Steuernummer wartet, ohne den Fragebogen abgeschickt zu haben, "
    "verliert Wochen.",
    S["text"],
))
A(Spacer(1, 8 * mm))
A(hinweis(
    "<b>Wichtiger Hinweis</b><br/><br/>"
    "Diese Checkliste ist eine Arbeitshilfe und ersetzt weder Steuer- noch "
    "Rechtsberatung. Sie beschreibt den Regelfall für Einzelunternehmer in "
    "Deutschland. Für erlaubnispflichtige Gewerbe (z. B. Gastronomie, Handwerk, "
    "Finanzdienstleistungen, Spielgeräte) gelten zusätzliche Anforderungen, die "
    "hier nicht abgebildet sind.<br/><br/>"
    "Rechtsstand: August 2026. Prüfe die aktuellen Werte vor deiner Gründung."
))
A(Spacer(1, 10 * mm))
A(Paragraph(
    "<b>So arbeitest du damit:</b> Druck die Checkliste aus und hake ab. Die "
    "Wartezeiten stehen dabei — plan sie ein, sie sind der Grund, warum eine "
    "Gründung länger dauert als gedacht.",
    S["klein"],
))
A(PageBreak())

# --- Phase 1 ------------------------------------------------------------
A(Paragraph("Phase 1 — Vorbereitung (Tag 1 bis 3)", S["h1"]))
A(Paragraph(
    "Bevor du irgendein Formular ausfüllst, müssen vier Dinge klar sein. "
    "Diese Entscheidungen später zu ändern kostet Geld und Zeit.",
    S["text"],
))
A(schritt_tabelle([
    ("<b>Rechtsform festlegen.</b> Für Einzelpersonen ist das Einzelunternehmen "
     "der Regelfall — keine Mindesteinlage, keine Notarkosten. Eine GmbH lohnt "
     "erst bei echtem Haftungsrisiko oder Partnern.",
     "Entscheidung für dich selbst. Bei Unsicherheit: Erstberatung beim "
     "Steuerberater, meist 100–200 €."),

    ("<b>Gewerbe oder Freiberuf klären.</b> Freiberufler (Ärzte, Anwälte, "
     "Journalisten, Ingenieure, Dozenten u. a. nach § 18 EStG) melden KEIN "
     "Gewerbe an und zahlen keine Gewerbesteuer.",
     "§ 18 EStG prüfen. Im Grenzfall vorab beim Finanzamt nachfragen — die "
     "Einordnung entscheidet das Finanzamt, nicht du."),

    ("<b>Tätigkeit präzise formulieren.</b> Diese Beschreibung steht später im "
     "Gewerbeschein und begrenzt, was du tun darfst.",
     "Lieber etwas weiter fassen, z. B. „Handel mit Waren aller Art, soweit "
     "nicht erlaubnispflichtig“, statt zu eng."),

    ("<b>Erlaubnispflicht prüfen.</b> Manche Tätigkeiten brauchen eine "
     "Genehmigung, bevor du überhaupt anmelden kannst.",
     "Beim Gewerbeamt nachfragen. Betrifft u. a. Gastronomie, Handwerk, "
     "Makler, Bewachung, Spielgeräte (§ 33c GewO)."),

    ("<b>Namen prüfen.</b> Als Einzelunternehmer firmierst du unter deinem "
     "eigenen Namen. Eine Fantasiebezeichnung darfst du als Zusatz führen, "
     "aber nicht als alleinigen Namen.",
     "Vorab prüfen: DPMA-Register auf Markenrechte, und ob die Domain frei ist."),
]))
A(Spacer(1, 5 * mm))
A(hinweis(
    "<b>Der teuerste Anfängerfehler:</b> Die Tätigkeit zu eng beschreiben. "
    "Wer „Verkauf von Kaffeeautomaten“ anmeldet und später auch Snacks "
    "verkaufen will, braucht eine kostenpflichtige Ummeldung. Formuliere von "
    "Anfang an so weit, wie es ehrlich passt."
))
A(PageBreak())

# --- Phase 2 ------------------------------------------------------------
A(Paragraph("Phase 2 — Anmeldung (Tag 4 bis 7)", S["h1"]))
A(Paragraph(
    "Jetzt gehst du zu den Behörden. Die Reihenfolge ist wichtig: Das "
    "Gewerbeamt informiert das Finanzamt automatisch — aber der Fragebogen "
    "kommt trotzdem nicht von allein.",
    S["text"],
))
A(schritt_tabelle([
    ("<b>Gewerbe anmelden</b> (entfällt bei Freiberuflern). Ausweis mitbringen, "
     "je nach Tätigkeit auch Genehmigungen.",
     "Gewerbeamt deiner Stadt oder Gemeinde, oft auch online. "
     "Kosten: 20–60 €, je nach Kommune."),

    ("<b>Fragebogen zur steuerlichen Erfassung</b> ausfüllen. Das ist der "
     "wichtigste Schritt — hier entscheidest du über die "
     "Kleinunternehmerregelung.",
     "Pflicht über ELSTER (elster.de), Papierform wird nicht mehr akzeptiert. "
     "Kostenlos."),

    ("<b>ELSTER-Zertifikat beantragen</b>, falls noch nicht vorhanden. "
     "Ohne das kommst du an den Fragebogen nicht heran.",
     "elster.de. <b>Achtung: Der Aktivierungscode kommt per Post und dauert "
     "5–10 Werktage.</b> Als Allererstes beantragen!"),

    ("<b>Umsatz schätzen.</b> Im Fragebogen musst du den erwarteten Umsatz für "
     "das laufende und das nächste Jahr angeben.",
     "Realistisch schätzen. Zu hoch geschätzt = keine Kleinunternehmer­regelung, "
     "obwohl sie dir zugestanden hätte."),

    ("<b>Kleinunternehmerregelung wählen</b> oder ablehnen.",
     "Siehe Entscheidungshilfe auf der nächsten Seite. Die Wahl bindet dich "
     "grundsätzlich 5 Jahre, wenn du sie ablehnst."),

    ("<b>IHK oder HWK</b> — die Mitgliedschaft entsteht automatisch, du musst "
     "nichts tun. Der Beitragsbescheid kommt von selbst.",
     "Beitrag ab ca. 30–70 €/Jahr. Bei geringem Gewinn gibt es Befreiungen — "
     "danach fragen, es passiert nicht automatisch."),
]))
A(Spacer(1, 5 * mm))
A(Paragraph(
    "<b>Beantrage das ELSTER-Zertifikat als Allererstes</b> — noch vor der "
    "Gewerbeanmeldung. Der Aktivierungscode kommt per Post und ist der häufigste "
    "Grund, warum Gründungen zwei Wochen länger dauern als geplant.",
    S["warnung"],
))
A(PageBreak())

# --- Entscheidungshilfe Kleinunternehmer --------------------------------
A(Paragraph("Entscheidungshilfe: Kleinunternehmerregelung", S["h1"]))
A(Paragraph(
    "Die Kleinunternehmerregelung nach § 19 UStG bedeutet: Du weist auf deinen "
    "Rechnungen keine Umsatzsteuer aus, führst keine ab — darfst dafür aber auch "
    "keine Vorsteuer aus deinen Einkäufen ziehen.",
    S["text"],
))
A(Spacer(1, 3 * mm))

vergleich = [
    [Paragraph("<b>Kriterium</b>", S["zelle_fett"]),
     Paragraph("<b>Kleinunternehmer</b>", S["zelle_fett"]),
     Paragraph("<b>Regelbesteuerung</b>", S["zelle_fett"])],
    [Paragraph("USt auf Rechnungen", S["zelle"]),
     Paragraph("nein, Hinweis nach § 19 UStG Pflicht", S["zelle"]),
     Paragraph("ja, 19 % oder 7 %", S["zelle"])],
    [Paragraph("Vorsteuer aus Einkäufen", S["zelle"]),
     Paragraph("nicht möglich", S["zelle"]),
     Paragraph("abziehbar", S["zelle"])],
    [Paragraph("Voranmeldungen", S["zelle"]),
     Paragraph("entfallen", S["zelle"]),
     Paragraph("monatlich oder quartalsweise", S["zelle"])],
    [Paragraph("Gut, wenn …", S["zelle"]),
     Paragraph("deine Kunden Privatpersonen sind und du wenig einkaufst", S["zelle"]),
     Paragraph("deine Kunden Unternehmen sind oder du viel investierst", S["zelle"])],
    [Paragraph("Bindung", S["zelle"]),
     Paragraph("jährlich wählbar", S["zelle"]),
     Paragraph("<b>5 Jahre Bindung bei freiwilligem Verzicht</b>", S["zelle"])],
]
t = Table(vergleich, colWidths=[38 * mm, 66 * mm, 66 * mm])
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

A(Paragraph("Die Grenzen seit der Reform 2025", S["h2"]))
A(Paragraph(
    "• <b>25.000 €</b> Umsatz im Vorjahr<br/>"
    "• <b>100.000 €</b> im laufenden Jahr",
    S["text"],
))
A(hinweis(
    "<b>Der Punkt, den fast alle übersehen:</b> Die 100.000-€-Grenze wirkt "
    "SOFORT. Wird sie mitten im Jahr überschritten, ist bereits der auslösende "
    "Umsatz umsatzsteuerpflichtig — nicht erst das Folgejahr. Wer dann seinen "
    "Kunden keine Umsatzsteuer berechnet hat, zahlt sie aus eigener Tasche."
))
A(Spacer(1, 4 * mm))
A(Paragraph(
    "Wichtig: Die Grenze gilt für deine gesamten unternehmerischen Umsätze als "
    "Person — nicht pro Betrieb. Wer zwei Tätigkeiten ausübt, muss beide "
    "zusammenrechnen.",
    S["text"],
))
A(PageBreak())

# --- Phase 3 ------------------------------------------------------------
A(Paragraph("Phase 3 — Aufbau (Tag 8 bis 14)", S["h1"]))
A(Paragraph(
    "Während du auf die Steuernummer wartest, richtest du den Betrieb ein. "
    "Diese Wartezeit kannst du nicht verkürzen, aber gut nutzen.",
    S["text"],
))
A(schritt_tabelle([
    ("<b>Geschäftskonto eröffnen.</b> Für Einzelunternehmer nicht gesetzlich "
     "vorgeschrieben, aber dringend zu empfehlen — vermischte Konten sind bei "
     "einer Prüfung ein echtes Problem.",
     "Viele Banken bieten kostenlose Geschäftskonten. Achtung: Private Konten "
     "dürfen laut AGB meist nicht geschäftlich genutzt werden."),

    ("<b>Buchhaltung einrichten.</b> Als Einzelunternehmer reicht die "
     "Einnahmen-Überschuss-Rechnung (EÜR) — keine doppelte Buchführung nötig.",
     "Tabelle oder Software. Wichtig ist nur, dass es von Anfang an lückenlos "
     "ist. Nachträglich rekonstruieren ist die Hölle."),

    ("<b>Belegablage festlegen.</b> Aufbewahrungsfrist: 10 Jahre für Rechnungen, "
     "unveränderbar.",
     "Digital scannen ist erlaubt (GoBD). Ordnerstruktur nach Jahr und Monat, "
     "fortlaufend nummeriert."),

    ("<b>Versicherungen prüfen.</b> Betriebshaftpflicht ist für die meisten "
     "sinnvoll. Krankenversicherung musst du selbst regeln.",
     "Krankenkasse informieren — als Selbstständiger änderst du den Status. "
     "Das passiert nicht automatisch."),

    ("<b>Rentenversicherungspflicht prüfen.</b> Manche Selbstständige sind "
     "pflichtversichert, u. a. bei nur einem Auftraggeber.",
     "§ 2 SGB VI prüfen. Betrifft u. a. Lehrer, Pfleger, Handwerker und "
     "arbeitnehmerähnliche Selbstständige."),

    ("<b>Rechnungsvorlage vorbereiten</b> mit allen Pflichtangaben nach "
     "§ 14 UStG.",
     "Fehlt eine Pflichtangabe, kann dein Kunde keine Vorsteuer ziehen und "
     "verlangt eine Korrektur."),

    ("<b>Impressum und Datenschutz</b>, falls du eine Website betreibst.",
     "Pflicht nach § 5 DDG. Ladungsfähige Anschrift nötig — ein Postfach "
     "reicht nicht."),
]))
A(PageBreak())

# --- Nach der Gründung --------------------------------------------------
A(Paragraph("Danach: Die wiederkehrenden Pflichten", S["h1"]))
A(Paragraph(
    "Die Gründung ist der einfache Teil. Diese Termine begleiten dich dauerhaft.",
    S["text"],
))

fristen = [
    [Paragraph("<b>Was</b>", S["zelle_fett"]),
     Paragraph("<b>Wann</b>", S["zelle_fett"]),
     Paragraph("<b>Betrifft</b>", S["zelle_fett"])],
    [Paragraph("Umsatzsteuer-Voranmeldung", S["zelle"]),
     Paragraph("bis zum 10. des Folgemonats bzw. -quartals", S["zelle"]),
     Paragraph("nur Regelbesteuerung", S["zelle"])],
    [Paragraph("Einkommensteuererklärung inkl. Anlage EÜR", S["zelle"]),
     Paragraph("bis 31. Juli des Folgejahres", S["zelle"]),
     Paragraph("alle", S["zelle"])],
    [Paragraph("Umsatzsteuer-Jahreserklärung", S["zelle"]),
     Paragraph("bis 31. Juli des Folgejahres", S["zelle"]),
     Paragraph("alle, auch Kleinunternehmer", S["zelle"])],
    [Paragraph("Gewerbesteuererklärung", S["zelle"]),
     Paragraph("bis 31. Juli des Folgejahres", S["zelle"]),
     Paragraph("ab 24.500 € Gewerbeertrag", S["zelle"])],
    [Paragraph("IHK-/HWK-Beitrag", S["zelle"]),
     Paragraph("jährlich per Bescheid", S["zelle"]),
     Paragraph("Gewerbetreibende", S["zelle"])],
]
t = Table(fristen, colWidths=[58 * mm, 62 * mm, 50 * mm])
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

A(Paragraph("Fünf Fehler, die richtig Geld kosten", S["h2"]))
A(Paragraph(
    "<b>1. Umsatz zu hoch schätzen.</b> Im Fragebogen einen Fantasiewert "
    "einzutragen kostet dich die Kleinunternehmerregelung.<br/><br/>"
    "<b>2. Belege nicht sammeln.</b> Was du nicht belegen kannst, erkennt das "
    "Finanzamt nicht an — auch wenn die Ausgabe echt war.<br/><br/>"
    "<b>3. Private und geschäftliche Ausgaben mischen.</b> Bei einer Prüfung "
    "wird im Zweifel alles privat.<br/><br/>"
    "<b>4. Rücklagen für Steuern vergessen.</b> Die erste Nachzahlung kommt oft "
    "erst nach 18 Monaten — und dann gleich mit Vorauszahlungen für das "
    "laufende Jahr. Faustregel: 30 % des Gewinns zurücklegen.<br/><br/>"
    "<b>5. Krankenkasse nicht informieren.</b> Der Statuswechsel passiert nicht "
    "automatisch. Nachzahlungen können vierstellig werden.",
    S["text"],
))
A(Spacer(1, 8 * mm))
A(hinweis(
    "Diese Checkliste ist eine Arbeitshilfe, keine Steuer- oder Rechtsberatung. "
    "Sie beschreibt den Regelfall und kann eine individuelle Beratung nicht "
    "ersetzen. Rechtsstand: August 2026."
))

# --- Dokument bauen -----------------------------------------------------
doc = BaseDocTemplate(
    "Gruender-Checkliste-14-Tage.pdf",
    pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm,
    topMargin=18 * mm, bottomMargin=20 * mm,
    title=TITEL, author="", subject=UNTERTITEL,
)
rahmen = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="standard", frames=rahmen, onPage=kopf_fuss)])
doc.build(inhalt)
print("gespeichert")
