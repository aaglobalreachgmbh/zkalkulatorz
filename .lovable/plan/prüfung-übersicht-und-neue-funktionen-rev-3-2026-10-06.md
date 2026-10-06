# Prüfung, Übersicht und neue Funktionen (Rev 3)

## 1. Kurzbefund (Stand heute, nach den letzten Umbauten)

Gut durchdacht
- Kalkulator (Hardware → Mobil → Festnetz → Zusammenfassung) mit Live-Marge, DGRV, GigaKombi – bei MoCare / C.A.T. so nicht vorhanden.
- Kunden-/Händleransicht (Marge/EK ausblendbar) – ideal fürs Kundengespräch.
- Nutzertypen (Shop/POS, Fachhändler, Direct Store, Außendienst, Hybrid), 6 Paletten, 3 Startseiten-Layouts.
- Vorlagen/Bundles, VVL-Tracker, Provisionen, Staffelboni, White-Label.

Noch nicht rund
- Neue Nutzer sehen eine leere App – Nutzen und Tagesablauf sind nicht erkennbar.
- Zu viele Menüpunkte (u. a. 6 Sicherheitsseiten), Sicherheitsbereich noch nicht gebündelt.
- Branding: man sieht nicht, ob ein Logo hinterlegt ist und wo stattdessen nur der Firmenname erscheint.
- Kein Werkzeug, das dem Kunden das Angebot verständlich erklärt.
- Kreuzgeschäft endet bei Mobilfunk/Festnetz – Strom/Gas fehlt als „Gesamtübersicht".

Markt (MoCare, C.A.T., klassische Shop-Kassen): Diese sind stark bei Kasse, Belegen, Provisionsabgleich und VVL-Kampagnen; unser Vorsprung bleibt die Live-Margenrechnung, die Kundenansicht und die individuelle Arbeitsoberfläche. Die neuen Punkte unten zielen genau auf „Kunde versteht das Angebot" und „Gesamtübersicht" – das hat kein Mitbewerber. Ich prüfe die Mitbewerber-Angaben bei der Umsetzung nochmals per Websuche und kennzeichne alles nicht Belegbare als offen.

## 2. Umsetzung (5 Schritte, alle vollständig)

1. Branding-Status
   - In „Branding" eine Statuskarte: Logo hinterlegt ja/nein, Vorschau, Größe/Format.
   - Liste aller Stellen (Kopfzeile, Seitenleiste, Startseite, Willkommensbanner, Angebots-PDF, Kundenbericht, geteiltes Angebot) mit Anzeige „Logo" oder „Firmenname (Ersatz)".
   - Funktioniert live: nach Hochladen/Entfernen aktualisiert sich die Liste sofort; defekte Logo-Adresse wird als „Logo lädt nicht" erkannt.

2. KI-Angebotserklärung
   - Im Angebot (Zusammenfassung und Angebotsdetail) Knopf „Für Kunden erklären".
   - Mitarbeiter wählt Kundentyp (z. B. Handwerk, Praxis, Büro), Ton (einfach / ausführlich) und Schwerpunkte (Kosten, Ersparnis, Vorteile).
   - Die KI erzeugt eine verständliche Erklärung: Monatskosten, Einmalkosten, 24-Monats-Summe, Vorteile – live eingeblendet, kopierbar, als Anhang ins PDF übernehmbar.
   - Es werden nur Kundendaten geschickt – nie Marge, EK oder Provision. Zahlen kommen aus der Kalkulation, die KI formuliert nur.

3. Beispielbetrieb („Demo-Firma")
   - Schalter „Beispieldaten anzeigen" (Startseite + Mein Arbeitsplatz), klar als „Demo" markiert.
   - Füllt Startseite, Kunden, Angebote, Verträge, VVL-Liste, Provisionen, Kalender und Reporting mit realistischen Beispielen (ca. 25 Kunden, 40 Angebote, 60 Verträge, Termine dieser Woche, Monatsziele).
   - Je Nutzertyp ein passender Tagesablauf (Shop: Kasse + Laufkundschaft, Außendienst: Route + Termine, Hybrid: Kreuzgeschäft-Chancen).
   - Nur lokal im Browser, nichts wird in echte Daten geschrieben; ein Klick blendet alles wieder aus. Funktioniert auch im Testmodus ohne Login.

4. Energie-Kreuzgeschäft (Strom/Gas, simuliert)
   - Neuer Bereich im Kreuzgeschäft und als optionaler Schritt „Energie" im Kalkulator-Ergebnis.
   - Eingabe: Verbrauch kWh, aktueller Abschlag; Beispieltarife (klar erfunden) zeigen Ersparnis.
   - „Gesamtübersicht für den Kunden": Mobilfunk + Festnetz + Hardware + Strom/Gas in einer Seite – monatlich, 24 Monate, Ersparnis gegenüber heute.
   - Händleransicht zusätzlich: geschätzte Zusatzprovision (Demo).

5. Übersicht und Ordnung
   - Startseite „Heute": Termine, fällige VVL, offene Angebote, Kreuzgeschäft-Chancen, Monatsziel.
   - Sicherheitsseiten unter einem Admin-Eintrag bündeln (Seiten bleiben erreichbar).
   - Kurze Rundgang-Hinweise beim ersten Öffnen der Demo-Firma.

## 3. Was bewusst nicht passiert
- Keine Änderung an der Kalkulationslogik, Rechten, Rollen oder echten Kundendaten.
- Energie-Tarife, Provisionen und Demo-Firma sind erfunden und so gekennzeichnet – keine echten Anbieter- oder Preisangaben.

## Technische Details
- Branding: neuer `useBrandingStatus` (Logo-URL vorhanden + Image-Load-Test), Karte `BrandingStatusCard` in `BrandingSettings.tsx`; Liste der Logo-Orte statisch gepflegt.
- KI: neue Edge Function `explain-offer` (Deno, CORS, JWT-Pflicht, Tenant-Check), Lovable AI Gateway `/v1/responses`, Modell `openai/gpt-6-astra`, gestreamt, Reasoning `low`, `store:false`; Eingabe zod-validiert und serverseitig auf Kundenfelder reduziert; 402/429/403 als verständliche Meldung im UI. Client-Komponente `OfferExplainDialog` mit Stop-Knopf.
- Demo-Firma: `demoMode`-Flag (scoped localStorage) + `demoDataset.ts`; bestehende Listen-Hooks erhalten einen Demo-Zweig, der statt Abfrage die lokalen Daten liefert (kein throw, Fallback). Banner über `DemoPageShell`-Stil.
- Energie: `energyDemo.ts` (Beispieltarife), Komponenten `EnergyCalculator` und `TotalOverview`; reine Frontend-Rechnung, nicht in `calculateOffer`.
- Navigation: Sidebar-Gruppe „Admin & Sicherheit"; AGENTS.md-Regel für Demo-Modus ergänzen.
