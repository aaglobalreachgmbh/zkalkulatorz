# App-Review, Marktvergleich und Innovations-Fahrplan

## 1. Was die App schon gut kann
- **Kalkulator (Herzstück):** Ablauf Hardware → Mobilfunk → Festnetz → Zusammenfassung, Perioden-/Aktionslogik, DGRV-Regel, GigaKombi, Marge live. Das gibt es bei keinem Mitbewerber.
- **Kundensitzung / Händler-Ansicht:** Marge und EK sind mit einem Klick ausgeblendet. Sehr gut für den Verkauf im Shop.
- **Bundles und Vorlagen:** Schnellstart für Standardangebote.
- **VVL-Tracker, Verträge, Kunden:** Basis für Bestandskundengeschäft.
- **Provisionen, Push-Prämien, Staffelboni, Mitarbeiter-Abzüge:** fachlich tief.
- **White-Label (Logo, Farben), Rollen, Lizenzen, POS-Modus:** gute Grundlage für Individualität.

## 2. Was noch nicht durchdacht ist
- **Zu viele Seiten (rund 48):** Sicherheit allein hat 6 Seiten, dazu Zeiterfassung, Gamification, Kalender, Postfach. Für einen Shop-Verkäufer verwirrend.
- **Kein Rollen-Startbildschirm:** Shop, Außendienst und Teamleiter sehen fast dieselbe Navigation.
- **Kein Kassen-Teil:** Zubehör/Hardware verkaufen, Beleg, Tagesabschluss fehlen (MoCare und C.A.T. haben das).
- **Keine Provisionskontrolle:** Abgleich erwarteter Provision mit Gutschrift des Distributors fehlt (Kernfunktion bei C.A.T.).
- **VVL ohne Kampagnen:** Liste ja, aber kein „alle fälligen Kunden per E-Mail/SMS/WhatsApp anschreiben".
- **Außendienst:** Besuchsberichte da, aber keine Tagesroute, kein Offline-Angebot, keine Unterschrift vor Ort.
- **Kreuzgeschäft:** Keine aktiven Hinweise „Kunde hat Mobilfunk, kein Festnetz → GigaKombi anbieten".
- **Design-Anpassung:** Nur Logo und Farbe; keine Layout-Varianten oder Paletten-Vorlagen.

## 3. UX-Eindruck
Kalkulator: stark, schnell, professionell. Gesamt-App: wirkt wie „alles auf einmal". Größter Hebel ist Reduzieren und nach Nutzertyp sortieren, nicht neue Funktionen.

## 4. Marktvergleich (Stand Okt. 2026, öffentliche Webseiten)
| Funktion | MoCare | C.A.T. | MargenKalkulator |
|---|---|---|---|
| Kasse/POS, GoBD | ja | ja | nein |
| Kunden-CRM | ja | ja | ja |
| Lager/Inventar | ja | teils | nein |
| VVL-Kampagnen SMS/WhatsApp | teils | ja | nein |
| Provisionskontrolle (Gutschrift-Import) | unbekannt | ja | nein |
| Digitale Unterschrift | unbekannt | ja | nein |
| Live-Margenkalkulation mit Tarif-/Aktionslogik | nein | nein | **ja** |
| Kunden-/Händleransicht | nein | nein | **ja** |
| Außendienst-Tools | nein | nein | teils |

Unser Vorsprung: Kalkulation + Vertriebswissen. Deren Vorsprung: Kasse, Kampagnen, Provisionskontrolle.

## 5. Vorschlag: Fahrplan (nur Oberfläche, Daten simuliert)
Alle Schritte als realistische Simulation mit Beispieldaten, ohne finale Verbindung zu Kasse/Netzbetreiber.

**Phase 1 – Rollen-Startseiten und Navigation aufräumen**
- Beim Start Nutzertyp wählen: Shop/POS, Fachhändler/Vertreter, Direct Store, Außendienst (BPO), Hybrid.
- Je Typ eigene Startseite und gekürzte Seitenleiste; Rest unter „Mehr".
- Sicherheits-Seiten in einen Admin-Bereich bündeln.

**Phase 2 – Design-Baukasten**
- 4–6 Paletten-Vorlagen (Vodafone-Rot bleibt Standard), Dichte (kompakt/komfortabel), 2–3 Startseiten-Layouts, live Vorschau.

**Phase 3 – Kreuzgeschäft-Assistent**
- Kundenkarte zeigt Chancen: fehlendes Festnetz, VVL fällig, GigaKombi möglich, mit „Angebot starten".

**Phase 4 – VVL-Kampagnen und Provisionskontrolle (simuliert)**
- Fällige Kunden auswählen → Vorlage für E-Mail/SMS/WhatsApp (Vorschau, kein echter Versand).
- Gutschrift-Datei hochladen → Abgleich erwartet/erhalten mit Differenzliste (Beispieldatei).

**Phase 5 – POS-Kasse light und Außendienst-Tag (simuliert)**
- Kasse: Zubehör + Vertrag auf einen Beleg, Tagesabschluss-Ansicht (als Demo gekennzeichnet, nicht GoBD).
- Außendienst: Tagesliste Termine, Angebot vor Ort, Unterschriftsfeld.

## Technische Hinweise
- Rollen-Startseite über Nutzerprofil-Einstellung, Lizenz/Feature-Flags steuern Sichtbarkeit (bestehendes System nutzen).
- Simulierte Module mit lokalen Beispieldaten und klarer Kennzeichnung „Demo".
- Kalkulations-Engine wird nicht verändert.
- Offen: MoCare-Details (Provisionen, Unterschrift) nur teilweise öffentlich – als unbekannt markiert.
