"""
Trägt die vier Automaten-Produkte in verkaufstexte.json nach.

Wiederholbar: ein Produkt, das schon in der Datei steht, wird ersetzt statt
ein zweites Mal angehängt. Erkannt wird es am Dateinamen — der ist eindeutig,
der Titel könnte sich noch ändern.
"""

import json
import pathlib

NEU = [
    {
        "datei": "Automaten-Rentabilitaetsrechner.xlsx",
        "titel": "Rentabilitätsrechner für Automatenaufsteller",
        "kategorie": "Vorlage",
        "preis": "19,90",
        "beschreibung": (
            "Trägt sich dieser Standort? Eine Zahl, und du weißt es.\n\n"
            "Die übliche Rechnung lautet: Automat 2.500 €, 50 Cent pro Verkauf, nach "
            "5.000 Verkäufen bin ich raus. Darin fehlen die Standortmiete, der Strom, "
            "deine eigenen Fahrten, der Schwund und die Rücklage für Reparaturen. "
            "Diese Datei rechnet vollständig.\n\n"
            "WAS DRIN IST\n"
            "• Standort-Rechner mit allen Kostenpositionen\n"
            "• Break-even: wie viele Verkäufe pro Tag der Automat braucht\n"
            "• Feste Miete und Umsatzbeteiligung im direkten Vergleich\n"
            "• Amortisationsdauer für Automat und Erstbefüllung\n"
            "• Vergleich von bis zu acht Standorten nebeneinander\n"
            "• Produktkalkulation je Artikel mit Marge und Rohertrag\n"
            "• Erfahrungswerte zum Nachschlagen: Verkaufsquoten, Stromverbrauch, "
            "Gebrauchtpreise, Reparaturkosten\n\n"
            "DER PUNKT, DEN FAST ALLE ÜBERSEHEN\n"
            "Die eigene Arbeitszeit. Wer für 60 € Rohertrag im Monat zweimal 30 km "
            "fährt und je eine Stunde befüllt, arbeitet für unter 10 € die Stunde. "
            "Diese Datei rechnet deine Zeit mit einem Stundensatz mit, den du selbst "
            "festlegst — und zeigt damit, warum sich ein einzelner Automat weit "
            "draußen fast nie trägt, ein Automat auf einer Tour dagegen schon.\n\n"
            "Funktioniert mit Excel, LibreOffice, Numbers und Google Tabellen.\n\n"
            "Arbeitshilfe, keine Rechts- oder Steuerberatung. Alle Zahlen sind "
            "Erfahrungswerte, keine Zusicherung. Stand: August 2026."
        ),
    },
    {
        "datei": "Automaten-Standort-Checkliste.pdf",
        "titel": "Der richtige Standort — Checkliste für Automatenaufsteller",
        "kategorie": "E-Book",
        "preis": "12,90",
        "beschreibung": (
            "Ein Automat verdient nicht durch Technik, sondern durch seinen Platz.\n\n"
            "Derselbe Automat bringt an einem Standort 200 € im Monat und am nächsten "
            "20 €. Der Unterschied entscheidet sich, bevor das Gerät geliefert wird. "
            "Sechs Seiten zum Ausdrucken und Mitnehmen.\n\n"
            "WAS DRIN IST\n"
            "• Sieben Standorttypen nach Ertrag sortiert — und drei, bei denen du "
            "besser nicht anfängst\n"
            "• Wie du ansprichst, und der Satz, der das Gespräch leichter macht\n"
            "• Bewertungsbogen mit Punktesystem: zwölf Kriterien, 0 bis 24 Punkte\n"
            "• Technik vor Ort: Stellfläche, Türbreiten, Strom, Temperatur, Empfang\n"
            "• Was im Standortvertrag geregelt sein muss — zwölf Punkte\n"
            "• Sechs Gründe, warum Standorte scheitern\n\n"
            "WARUM EIN PUNKTESYSTEM\n"
            "Der Blick auf einen möglichen Standort ist immer optimistisch. Man sieht "
            "die Menschen, nicht die Kantine um die Ecke. Man sieht die Steckdose, "
            "nicht die Frage, wer den Strom zahlt. Ein Bewertungsbogen zwingt dazu, "
            "auch die unbequemen Fragen zu stellen — vor der Zusage, nicht danach.\n\n"
            "ZUM THEMA VERTRAG\n"
            "Die Checkliste nennt die zwölf Punkte, die ein Standortvertrag regeln "
            "muss. Sie enthält bewusst keine Vertragsformulierungen: Einen Vertrag, "
            "den du dauerhaft verwendest, sollte einmalig ein Anwalt aufsetzen. Was "
            "hier steht, ist die Liste der Fragen — damit du weißt, worauf du achten "
            "musst.\n\n"
            "Arbeitshilfe, keine Rechts- oder Steuerberatung. Alle Zahlen sind "
            "Erfahrungswerte, keine Zusicherung. Stand: August 2026."
        ),
    },
    {
        "datei": "Automaten-Wartungsplaner.xlsx",
        "titel": "Wartungs- und Befüllungsplaner für Automaten",
        "kategorie": "Vorlage",
        "preis": "12,90",
        "beschreibung": (
            "Mit einem Automaten hat man alles im Kopf. Ab dem dritten nicht mehr.\n\n"
            "Diese Datei hält fest, wann welcher Automat gewartet werden muss, welcher "
            "Artikel an welchem Standort läuft und was am Ende wirklich in der Kasse "
            "ankommt.\n\n"
            "WAS DRIN IST\n"
            "• Automatenstamm mit Wartungsintervall und automatischer "
            "Fälligkeitsanzeige\n"
            "• Überfällige Geräte werden rot markiert\n"
            "• Befüllprotokoll für 300 Einträge\n"
            "• Kassenabrechnung für 150 Leerungen, mit Rohertrag je Leerung\n"
            "• Auswertung je Artikel und je Standort\n"
            "• Ladenhüter-Erkennung mit selbst gesetzter Grenze\n\n"
            "DER EIGENTLICHE NUTZEN\n"
            "In fast jedem Automaten stehen zwei bis drei Artikel, die kaum jemand "
            "kauft. Sie binden dein Geld, laufen ab und belegen einen Schacht, der "
            "verdienen könnte. Ohne Aufzeichnung merkst du das nicht — du siehst ja "
            "nur, was fehlt, nicht was steht. Die Auswertung zeigt dir genau diese "
            "Artikel, und zwar getrennt nach Standort. Derselbe Riegel kann an einem "
            "Ort Verkaufsschlager und am nächsten Ladenhüter sein.\n\n"
            "Funktioniert mit Excel, LibreOffice, Numbers und Google Tabellen.\n\n"
            "Arbeitshilfe, keine Rechts- oder Steuerberatung. Stand: August 2026."
        ),
    },
    {
        "datei": "Automaten-Starterpaket.zip",
        "titel": "Automaten-Starterpaket — alle drei Werkzeuge",
        "kategorie": "Vorlage",
        "preis": "34,90",
        "beschreibung": (
            "Alle drei Werkzeuge für Automatenaufsteller zusammen — von der "
            "Standortsuche bis zur laufenden Betreuung.\n\n"
            "Einzeln kosten sie 45,70 €. Im Paket 34,90 €.\n\n"
            "WAS DRIN IST\n"
            "• Der richtige Standort — Checkliste und Bewertungsbogen (PDF, 6 Seiten)\n"
            "• Rentabilitätsrechner für Automatenaufsteller (XLSX)\n"
            "• Wartungs- und Befüllungsplaner (XLSX)\n"
            "• Anleitung, die die drei in die richtige Reihenfolge bringt\n\n"
            "DIE REIHENFOLGE, DIE SICH BEWÄHRT\n"
            "1. Checkliste lesen, damit du weißt, wonach du suchst.\n"
            "2. Standort besichtigen, Bewertungsbogen ausfüllen.\n"
            "3. Über 15 Punkte: im Rentabilitätsrechner durchrechnen.\n"
            "4. Trägt er sich: schriftlich vereinbaren, dann aufstellen.\n"
            "5. Ab dann laufend im Wartungsplaner mitschreiben.\n\n"
            "Der häufigste Fehler ist, Schritt 3 zu überspringen. Ein Standort fühlt "
            "sich fast immer besser an, als er rechnet.\n\n"
            "Arbeitshilfen, keine Rechts- oder Steuerberatung. Alle Zahlen sind "
            "Erfahrungswerte, keine Zusicherung. Stand: August 2026."
        ),
    },
]


def main() -> None:
    pfad = pathlib.Path(__file__).with_name("verkaufstexte.json")
    daten = json.loads(pfad.read_text(encoding="utf-8"))

    nach_datei = {p["datei"]: i for i, p in enumerate(daten["produkte"])}
    for produkt in NEU:
        if produkt["datei"] in nach_datei:
            daten["produkte"][nach_datei[produkt["datei"]]] = produkt
        else:
            daten["produkte"].append(produkt)

    pfad.write_text(
        json.dumps(daten, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"{len(daten['produkte'])} Produkte in verkaufstexte.json:")
    for p in daten["produkte"]:
        print(f"  {p['preis']:>6} EUR   {p['titel']}")


if __name__ == "__main__":
    main()
