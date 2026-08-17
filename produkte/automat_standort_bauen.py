"""
Erzeugt die Standort-Checkliste für Automatenaufsteller als PDF.

Verkaufsprodukt für den Marktplatz. Zielgruppe: Leute, die Snack- oder
Getränkeautomaten aufstellen und einen neuen Standort bewerten wollen, bevor
sie zusagen.

Der Kern des Produkts ist der Bewertungsbogen mit Punktesystem: Der Blick auf
einen Standort ist immer optimistisch. Ein Punkteschema zwingt dazu, auch die
unbequemen Fragen zu stellen — Zugang, Strom, Ansprechpartner, Konkurrenz um
die Ecke.

Bewusst NICHT enthalten: fertige Vertragstexte. Vertragsmuster, die der
Verkäufer in Umlauf bringt, sind sein Haftungsrisiko. Stattdessen steht hier,
WAS im Vertrag geregelt sein muss — der Käufer weiß dann, worauf er achten
muss, ohne dass ihm jemand eine Formulierung vorgibt.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
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

TITEL = "Der richtige Standort"
UNTERTITEL = "Checkliste und Bewertungsbogen für Automatenaufsteller"

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
    "zelle": ParagraphStyle(
        "zelle", parent=stile["Normal"], fontName="Helvetica",
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


def kaestchen(breite=4.5):
    """
    Ankreuz-Kästchen als gezeichnetes Rechteck.

    Bewusst KEIN Unicode-Zeichen wie ☐: Die Standardschriften eines PDF
    (Helvetica, Times) enthalten dieses Glyph nicht. Im Druck erscheint dann
    ein leerer Fleck — bei einer Checkliste zum Abhaken der schlimmste Fall.
    """
    k = Table([[""]], colWidths=[breite * mm], rowHeights=[breite * mm])
    k.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, DUNKEL),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return k


def schritt_tabelle(zeilen, spalte2="Worauf du achtest", spalte3="Warum"):
    daten = [[
        Paragraph("<b>geprüft</b>", S["zelle"]),
        Paragraph(f"<b>{spalte2}</b>", S["zelle"]),
        Paragraph(f"<b>{spalte3}</b>", S["zelle"]),
    ]]
    for was, warum in zeilen:
        daten.append([kaestchen(), Paragraph(was, S["zelle"]),
                      Paragraph(warum, S["zelle"])])

    t = Table(daten, colWidths=[15 * mm, 76 * mm, 79 * mm], repeatRows=1)
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


def hinweis(text, farbe=GELB, rahmen="#D6B656"):
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


inhalt = []
A = inhalt.append

# =========================================================================
# Titelseite
# =========================================================================

A(Spacer(1, 28 * mm))
A(Paragraph(TITEL, S["titel"]))
A(Paragraph(UNTERTITEL, S["untertitel"]))
A(Spacer(1, 5 * mm))
A(Paragraph(
    "Ein Automat verdient nicht durch Technik, sondern durch seinen Platz. "
    "Derselbe Automat bringt an einem Standort 200 € im Monat und am nächsten "
    "20 €. Der Unterschied entscheidet sich, bevor das Gerät geliefert wird.",
    S["text"],
))
A(Paragraph(
    "Das Problem: Der Blick auf einen möglichen Standort ist immer "
    "optimistisch. Man sieht die Menschen, nicht die Kantine um die Ecke. Man "
    "sieht die Steckdose, nicht die Frage, wer den Strom zahlt. Diese "
    "Checkliste zwingt dich, auch die unbequemen Fragen zu stellen — und zwar "
    "vor der Zusage, nicht danach.",
    S["text"],
))
A(Spacer(1, 7 * mm))
A(hinweis(
    "<b>Was drin ist</b><br/><br/>"
    "1.  Wo du Standorte findest und wie du sie ansprichst<br/>"
    "2.  Der Bewertungsbogen mit Punktesystem — zum Ausdrucken und Mitnehmen<br/>"
    "3.  Die Technik vor Ort: Strom, Zugang, Stellfläche, Untergrund<br/>"
    "4.  Was im Standortvertrag geregelt sein muss<br/>"
    "5.  Woran Standorte scheitern"
))
A(Spacer(1, 7 * mm))
A(hinweis(
    "<b>Wichtiger Hinweis</b><br/><br/>"
    "Diese Checkliste ist eine Arbeitshilfe und ersetzt weder Rechts- noch "
    "Steuerberatung. Alle Zahlen sind Erfahrungswerte und keine Zusicherung — "
    "sie schwanken je nach Region, Branche und Warenangebot erheblich.<br/><br/>"
    "Abschnitt 4 nennt die Punkte, die ein Standortvertrag regeln sollte. Er "
    "enthält bewusst <b>keine Vertragsformulierungen</b>. Lass einen Vertrag, "
    "den du dauerhaft verwenden willst, einmalig anwaltlich aufsetzen — das "
    "kostet einmal Geld und trägt dann über Jahre.<br/><br/>"
    "Stand: August 2026.",
    farbe=colors.HexColor("#FDECEC"), rahmen="#C00000",
))
A(PageBreak())

# =========================================================================
# 1 — Standorte finden
# =========================================================================

A(Paragraph("1 — Wo du Standorte findest", S["h1"]))
A(Paragraph(
    "Die besten Standorte sind Orte, an denen Menschen warten müssen und "
    "nichts anderes zu kaufen bekommen. Warten ist der eigentliche Auslöser, "
    "nicht der Hunger.",
    S["text"],
))

A(Paragraph("Nach Ertrag sortiert", S["h2"]))
A(schritt_tabelle([
    ("<b>Produktionsbetriebe mit Schichtbetrieb</b>, 30 bis 300 Beschäftigte",
     "Feste Pausenzeiten, oft keine Kantine, nachts und am Wochenende gar keine "
     "Alternative. Der ergiebigste Standorttyp."),
    ("<b>Waschsalons</b>",
     "Der Kunde wartet 40 Minuten und kann nicht weg. Wenig Personen, aber sehr "
     "hohe Kaufquote je Person."),
    ("<b>Handwerksbetriebe und Autohäuser</b> mit Wartebereich",
     "Kunden warten auf ihr Fahrzeug. Zusätzlich die eigenen Beschäftigten."),
    ("<b>Sportvereine, Vereinsheime, Hallen</b>",
     "Abends und am Wochenende stark, tagsüber tot. Getränke laufen deutlich "
     "besser als Snacks."),
    ("<b>Arztpraxen und Therapiezentren</b> mit langen Wartezeiten",
     "Wenig Durchsatz, aber praktisch keine Konkurrenz. Getränke statt Snacks."),
    ("<b>Studentenwohnheime, Internate</b>",
     "Abends und nachts stark. Erhöhtes Risiko für Beschädigung — "
     "Standort gut ausleuchten lassen."),
    ("<b>Bürogebäude mit mehreren Mietern</b>",
     "Ansprechpartner ist die Hausverwaltung, nicht die einzelne Firma. Ein "
     "Automat versorgt mehrere Unternehmen."),
]))

A(Paragraph("Wo du besser nicht anfängst", S["h2"]))
A(Paragraph(
    "<b>Standorte mit Kantine, Bäcker oder Supermarkt in Sichtweite.</b> Der "
    "Automat ist dort immer die zweite Wahl und wird nur genutzt, wenn alles "
    "andere geschlossen hat.<br/><br/>"
    "<b>Reine Publikumsflächen ohne Wartezeit</b> — Durchgänge, Foyers, "
    "Eingangsbereiche. Wer im Gehen ist, kauft nicht.<br/><br/>"
    "<b>Standorte ohne festen Ansprechpartner.</b> Wenn niemand zuständig ist, "
    "ist auch niemand zuständig, wenn der Automat im Weg steht.",
    S["text"],
))

A(Paragraph("Wie du ansprichst", S["h2"]))
A(Paragraph(
    "Nicht per E-Mail. Geh hin, frag nach der Person, die über die Fläche "
    "entscheidet, und stell dich kurz vor. Der entscheidende Satz ist nicht "
    "„Ich möchte einen Automaten aufstellen“, sondern <b>„Ihre Leute hätten "
    "dann rund um die Uhr etwas zu trinken, und Sie haben damit keine "
    "Arbeit.“</b> Der Standort gibt dir Fläche, du löst ihm ein Problem — so "
    "herum ist das Gespräch leichter.",
    S["text"],
))
A(hinweis(
    "<b>Zur Vergütung:</b> Frag zuerst nach der kostenlosen Aufstellung. Viele "
    "Betriebe verlangen nichts, wenn die Belegschaft den Automaten möchte — "
    "sie sehen ihn als Leistung für ihre Leute. Wer von sich aus mit einer "
    "Umsatzbeteiligung anfängt, verhandelt gegen sich selbst."
))
A(PageBreak())

# =========================================================================
# 2 — Bewertungsbogen
# =========================================================================

A(Paragraph("2 — Bewertungsbogen", S["h1"]))
A(Paragraph(
    "Zum Ausdrucken und Mitnehmen. Vergib je Zeile 0, 1 oder 2 Punkte und "
    "zähl unten zusammen. Das Schema ist nicht wissenschaftlich — es soll "
    "verhindern, dass ein einzelner guter Eindruck alles andere überdeckt.",
    S["text"],
))

bewertung = [
    ("Personen täglich am Automaten", "unter 30", "30 bis 80", "über 80"),
    ("Wartezeit vor Ort", "keine, alle im Gehen", "gelegentlich", "regelmäßig, mehrere Minuten"),
    ("Konkurrenz in Sichtweite", "Kantine oder Laden", "Bäcker in 5 Min. Fußweg", "nichts in der Nähe"),
    ("Zugang zum Befüllen", "nur nach Anmeldung", "zu Öffnungszeiten", "eigener Schlüssel"),
    ("Stromanschluss", "keiner in der Nähe", "vorhanden, Kosten offen", "vorhanden und geklärt"),
    ("Ansprechpartner", "wechselnd oder unklar", "eine Person, selten da", "fest und erreichbar"),
    ("Entfernung von deiner Basis", "über 25 km", "10 bis 25 km", "unter 10 km"),
    ("Andere Standorte auf dem Weg", "keine", "einer", "mehrere — Tour möglich"),
    ("Sichtbarkeit des Aufstellorts", "abseits, muss man suchen", "am Rand", "direkt im Blickfeld"),
    ("Standortvergütung", "über 15 % oder über 60 €", "bis 15 % oder bis 60 €", "kostenlos"),
    ("Risiko für Beschädigung", "unbeaufsichtigt, nachts offen", "teilweise einsehbar", "beaufsichtigt"),
    ("Dauer der Zusage", "jederzeit kündbar", "unklar", "schriftlich, mit Laufzeit"),
]

daten = [[Paragraph("<b>Kriterium</b>", S["zelle"]),
          Paragraph("<b>0 Punkte</b>", S["zelle"]),
          Paragraph("<b>1 Punkt</b>", S["zelle"]),
          Paragraph("<b>2 Punkte</b>", S["zelle"]),
          Paragraph("<b>deine<br/>Punkte</b>", S["zelle"])]]
for krit, p0, p1, p2 in bewertung:
    daten.append([
        Paragraph(f"<b>{krit}</b>", S["zelle"]),
        Paragraph(p0, S["zelle"]),
        Paragraph(p1, S["zelle"]),
        Paragraph(p2, S["zelle"]),
        "",
    ])
daten.append([Paragraph("<b>Summe</b>", S["zelle"]), "", "", "", ""])

tab = Table(daten, colWidths=[42 * mm, 36 * mm, 36 * mm, 38 * mm, 18 * mm],
            repeatRows=1)
tab.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), DUNKEL),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFBFBF")),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("BACKGROUND", (4, 1), (4, -1), GELB),
    ("BACKGROUND", (0, -1), (-1, -1), HELL),
    ("ROWBACKGROUNDS", (0, 1), (3, -2), [colors.white, colors.HexColor("#F7F9FC")]),
]))
A(tab)
A(Spacer(1, 5 * mm))
A(hinweis(
    "<b>So liest du die Summe</b> (von 24 möglichen Punkten)<br/><br/>"
    "<b>unter 10</b> — Finger weg. Der Standort kostet dich mehr Zeit, als er "
    "einbringt.<br/>"
    "<b>10 bis 15</b> — nur, wenn er auf einer Tour liegt, die du ohnehin "
    "fährst.<br/>"
    "<b>16 bis 20</b> — guter Standort. Rechne ihn im Rentabilitätsrechner "
    "durch und sichere ihn schriftlich.<br/>"
    "<b>über 20</b> — sofort zusagen. Solche Standorte sind selten."
))
A(PageBreak())

# =========================================================================
# 3 — Technik vor Ort
# =========================================================================

A(Paragraph("3 — Die Technik vor Ort", S["h1"]))
A(Paragraph(
    "Diese Punkte klärst du beim ersten Besuch, nicht am Liefertag. Ein "
    "Automat, der vor der Tür steht und nicht hineinpasst, kostet einen "
    "kompletten Arbeitstag.",
    S["text"],
))
A(schritt_tabelle([
    ("<b>Stellfläche ausgemessen</b> — Breite, Tiefe, Höhe, plus Platz zum "
     "Öffnen der Tür",
     "Die Tür eines Snackautomaten schwenkt weit auf. Miss den Schwenkbereich "
     "mit, nicht nur die Grundfläche."),
    ("<b>Weg zum Aufstellort geprüft</b> — Türbreiten, Stufen, Aufzug, "
     "Kurvenradien",
     "Ein Automat wiegt 200 bis 400 kg. Eine einzige zu schmale Tür macht die "
     "Aufstellung unmöglich."),
    ("<b>Untergrund tragfähig und eben</b>",
     "Auf unebenem Boden verklemmen Spiralen und Münzprüfer. Schiefe Automaten "
     "produzieren Störungen und Reklamationen."),
    ("<b>Steckdose in Reichweite</b>, eigener Stromkreis wenn möglich",
     "Verlängerungskabel quer durch den Raum sind eine Stolperfalle — und im "
     "Schadensfall eine Haftungsfrage."),
    ("<b>Wer zahlt den Strom? Schriftlich festgehalten</b>",
     "Der häufigste nachträgliche Streitpunkt. Ungeklärt kommt irgendwann eine "
     "Nachforderung."),
    ("<b>Mobilfunkempfang geprüft</b> (nur bei Telemetrie oder Kartenzahlung)",
     "In Kellern und Hallen oft kein Netz. Ohne Empfang funktioniert das "
     "Kartenmodul nicht."),
    ("<b>Temperatur am Aufstellort</b> — im Sommer wie im Winter",
     "Über 30 °C verformt Schokolade, unter 5 °C leidet die Technik. Beides "
     "kostet Ware."),
    ("<b>Direkte Sonneneinstrahlung ausgeschlossen</b>",
     "Sonne auf der Scheibe heizt den Innenraum auf und bleicht die Ware aus."),
    ("<b>Zugang außerhalb der Öffnungszeiten geklärt</b>",
     "Wenn du nur dienstags von 9 bis 11 Uhr hineinkommst, bestimmt der "
     "Standort deinen Kalender."),
    ("<b>Abfalleimer in der Nähe vorhanden</b>",
     "Fehlt er, liegen die Verpackungen auf dem Boden — und der Automat wird "
     "zum Ärgernis statt zur Wohltat."),
]))
A(PageBreak())

# =========================================================================
# 4 — Was im Vertrag stehen muss
# =========================================================================

A(Paragraph("4 — Was im Standortvertrag geregelt sein muss", S["h1"]))
A(Paragraph(
    "Eine mündliche Zusage hält genau so lange, wie die Person im Amt ist, die "
    "sie gegeben hat. Wechselt der Betriebsleiter, weiß der Nachfolger von "
    "nichts — und dein Automat steht plötzlich im Weg.",
    S["text"],
))
A(Paragraph(
    "Die folgenden Punkte gehören in eine schriftliche Vereinbarung. Was hier "
    "steht, ist die <b>Liste der zu regelnden Fragen</b>, nicht der "
    "Vertragstext dazu.",
    S["text"],
))
A(schritt_tabelle([
    ("<b>Wer sind die Vertragspartner?</b> Vollständige Firmierung, Anschrift, "
     "vertretungsberechtigte Person",
     "Ein Vertrag mit „Herrn Meier“ statt mit der GmbH nützt beim "
     "Inhaberwechsel nichts."),
    ("<b>Wo genau steht der Automat?</b> Raum, Etage, Stellplatz",
     "Verhindert, dass der Automat später in eine tote Ecke geschoben wird."),
    ("<b>Wem gehört der Automat?</b> Ausdrücklich: Eigentum bleibt bei dir",
     "Bei einer Insolvenz des Standorts entscheidet das darüber, ob dein Gerät "
     "in die Masse fällt."),
    ("<b>Laufzeit und Kündigungsfrist</b>",
     "Ohne Frist kann der Standort dich von heute auf morgen vor die Tür "
     "setzen — nach deiner Investition."),
    ("<b>Vergütungsmodell</b>: feste Miete oder Umsatzbeteiligung, mit Betrag "
     "oder Prozentsatz, Fälligkeit und Abrechnungszeitraum",
     "Bei Beteiligung zusätzlich festhalten, ob vom Brutto- oder Nettoumsatz "
     "gerechnet wird. Der Unterschied sind bis zu 19 %."),
    ("<b>Wer trägt die Stromkosten?</b>",
     "Der häufigste Streitpunkt überhaupt."),
    ("<b>Zugangsrecht zum Befüllen und Warten</b>, mit Zeiten",
     "Ohne diese Regelung hängt dein Arbeitsplan an der Laune des Pförtners."),
    ("<b>Wer haftet bei Beschädigung oder Diebstahl?</b>",
     "Vandalismus am Automaten und Diebstahl aus der Kasse sind getrennt zu "
     "betrachten."),
    ("<b>Was passiert bei Eigentümer- oder Betreiberwechsel?</b>",
     "Ohne Regelung endet dein Standort mit dem Verkauf des Betriebs."),
    ("<b>Wer bestimmt das Sortiment und die Preise?</b>",
     "Manche Standorte wollen mitreden — etwa Schulen bei zuckerhaltigen "
     "Produkten. Das gehört vorher geklärt."),
    ("<b>Rückbau am Ende</b>: Frist zum Abholen, Zustand der Fläche",
     "Sonst streitet man am Schluss über Bodenschäden und Lagerkosten."),
    ("<b>Schriftform für Änderungen</b>",
     "Verhindert, dass eine Flurgespräch-Zusage später als Vertragsänderung "
     "behauptet wird."),
]))
A(Spacer(1, 4 * mm))
A(hinweis(
    "<b>Empfehlung</b><br/><br/>"
    "Lass dir einen Standortvertrag <b>einmal</b> von einem Anwalt aufsetzen, "
    "wenn du mehr als zwei oder drei Automaten planst. Das kostet einmalig "
    "wenige hundert Euro und trägt dann über Jahre für alle Standorte.<br/><br/>"
    "Für den Anfang genügt eine kurze schriftliche Vereinbarung, die die Punkte "
    "oben abdeckt und von beiden Seiten unterschrieben ist. Auch eine "
    "einseitige Vereinbarung ist unendlich viel besser als ein Handschlag.",
    farbe=colors.HexColor("#EAF3E6"), rahmen="#6AA84F",
))
A(PageBreak())

# =========================================================================
# 5 — Woran Standorte scheitern
# =========================================================================

A(Paragraph("5 — Woran Standorte scheitern", S["h1"]))
A(Paragraph(
    "<b>1. Die eigene Zeit wird nicht mitgerechnet.</b><br/>"
    "Wer für 60 € Rohertrag im Monat zweimal 30 Kilometer fährt und je eine "
    "Stunde befüllt, arbeitet für unter 10 € die Stunde — und hat den Sprit "
    "noch nicht abgezogen. Ein einzelner Automat weit draußen trägt sich fast "
    "nie. Er trägt sich erst, wenn er auf einer Tour liegt.",
    S["text"],
))
A(Paragraph(
    "<b>2. Die Umsatzbeteiligung wird unterschätzt.</b><br/>"
    "15 % klingen wenig. Bei einem Verkaufspreis von 1,20 € sind das 18 Cent — "
    "bei einem Rohertrag von 55 Cent also fast ein Drittel deines Ertrags. Rechne "
    "beide Modelle durch, bevor du unterschreibst.",
    S["text"],
))
A(Paragraph(
    "<b>3. Es gibt keine Rücklage für Reparaturen.</b><br/>"
    "Ein Münzprüfer kostet im Ersatz mehrere hundert Euro, ein Kühlaggregat "
    "mehr. Wer damit nicht rechnet, hält seinen Standort für rentabel, bis der "
    "erste Schaden kommt — und steht dann ohne Puffer da.",
    S["text"],
))
A(Paragraph(
    "<b>4. Der Automat ist zu selten voll.</b><br/>"
    "Zwei leere Schächte kosten nicht nur diese Verkäufe. Wer zweimal vor einem "
    "halbleeren Automaten steht, geht beim dritten Mal gar nicht mehr hin. "
    "Stammkunden zurückzugewinnen dauert Monate.",
    S["text"],
))
A(Paragraph(
    "<b>5. Das Sortiment wird nie überprüft.</b><br/>"
    "In fast jedem Automaten stehen zwei bis drei Artikel, die praktisch "
    "niemand kauft. Sie binden Kapital, laufen ab und belegen einen Schacht, "
    "der Geld verdienen könnte. Wer seine Verbräuche nicht mitschreibt, merkt "
    "es nicht.",
    S["text"],
))
A(Paragraph(
    "<b>6. Kein Bargeld, kein Verkauf.</b><br/>"
    "Der Anteil der Menschen ohne Kleingeld wächst jedes Jahr. Ein Kartenmodul "
    "kostet Anschaffung und laufende Gebühren, kann den Umsatz aber deutlich "
    "heben. Rechne es durch, statt es aus dem Bauch abzulehnen.",
    S["text"],
))
A(Spacer(1, 8 * mm))
A(hinweis(
    "Diese Checkliste ist eine Arbeitshilfe, keine Rechts- oder "
    "Steuerberatung. Alle genannten Zahlen sind Erfahrungswerte und keine "
    "Zusicherung. Prüfe sie für deinen eigenen Fall. Stand: August 2026."
))

# =========================================================================

doc = BaseDocTemplate(
    "Automaten-Standort-Checkliste.pdf",
    pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm,
    topMargin=18 * mm, bottomMargin=20 * mm,
    title=TITEL, author="", subject=UNTERTITEL,
)
rahmen = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="standard", frames=rahmen, onPage=kopf_fuss)])
doc.build(inhalt)
print("Automaten-Standort-Checkliste.pdf erzeugt")
