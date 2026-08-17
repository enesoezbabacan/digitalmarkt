/**
 * Gemeinsames Layout für die Rechtstexte und das Meldeformular.
 *
 * Bewusst OHNE pauschales Hinweisbanner: Das Meldeformular nach Art. 16 DSA
 * liegt in derselben Route-Gruppe, ist aber fertig und in Betrieb. Ein
 * "Platzhalter" darüber wäre schlicht falsch und würde Melder verunsichern.
 * Den Entwurfshinweis setzt jede Seite selbst über <Rechtshinweis />.
 */
export default function RechtlichesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-4">{children}</div>
    </div>
  );
}
