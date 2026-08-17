import { fehlendeAngaben } from "@/lib/anbieter";

/**
 * Hinweise über einem Rechtstext.
 *
 * Zwei getrennte Fälle, die nicht vermischt werden dürfen:
 *
 * - `entwurf`: Der Text ist ein Entwurf und noch nicht anwaltlich geprüft.
 *   Das steht dort, damit niemand — auch nicht der Betreiber selbst — den
 *   Stand für abgesichert hält.
 * - fehlende Pflichtangaben: kommen aus lib/anbieter.ts und verschwinden von
 *   selbst, sobald die Angabe eingetragen ist.
 */
export function Rechtshinweis({ entwurf = true }: { entwurf?: boolean }) {
  const fehlt = fehlendeAngaben();

  return (
    <>
      {entwurf && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Entwurf.</strong> Dieser Text wurde nicht anwaltlich geprüft.
          Vor dem ersten echten Verkauf muss ein Rechtsanwalt darüber sehen —
          fehlerhafte Pflichtangaben sind der häufigste Abmahngrund.
        </div>
      )}

      {fehlt.length > 0 && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <strong>Es fehlen noch Pflichtangaben:</strong> {fehlt.join(", ")}.
          Einzutragen in <code>src/lib/anbieter.ts</code>.
        </div>
      )}
    </>
  );
}
