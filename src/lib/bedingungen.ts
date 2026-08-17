/**
 * Stand der Vertragstexte.
 *
 * Eine einzige Stelle, weil derselbe Wert an zwei sehr verschiedenen Orten
 * gebraucht wird:
 *
 *   - sichtbar unter AGB und Verkäufervertrag ("Stand: August 2026")
 *   - gespeichert bei jedem Verkäufer, der zugestimmt hat
 *
 * Laufen die beiden auseinander, ist der gespeicherte Nachweis wertlos: Es
 * ließe sich nicht mehr sagen, welchem Text jemand tatsächlich zugestimmt hat.
 *
 * WICHTIG bei jeder inhaltlichen Änderung der Texte: diesen Wert hochsetzen.
 * Sonst tragen alte und neue Zustimmungen dieselbe Fassung, obwohl sie
 * verschiedene Texte meinen. Nach § 12 AGB sind Verkäufer außerdem dreißig
 * Tage vorher per E-Mail zu informieren.
 */

/** Maschinenlesbar — wird in der Datenbank gespeichert. */
export const BEDINGUNGEN_FASSUNG = "2026-08";

/** Für Menschen — steht unter den Rechtstexten. */
export const BEDINGUNGEN_STAND = "August 2026";
