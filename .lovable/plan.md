# Absturz der Startseite beheben

## Ursache (reproduziert)
Angemeldet mit einem normalen Konto stürzt die Startseite ab: „Too many re-renders“ in der Startseite. Kalkulator, Kunden, Angebote und Verträge laden normal.

Die Startseite fragt seit der letzten Änderung beim Anzeigen ab, ob ein öffentlicher Demo-Zugang aktiv ist. Ist keiner vorhanden, „räumt“ diese Prüfung jedes Mal auf und meldet dabei eine Änderung am Demo-Modus. Darauf zeichnet sich die Startseite neu, prüft erneut, und das geht endlos weiter.

## Änderung
1. Die Prüfung auf den Demo-Zugang räumt nur noch auf, wenn wirklich ein abgelaufenes Demo-Ticket gespeichert ist. Ohne Ticket gibt sie nur „nicht aktiv“ zurück und meldet keine Änderung.
2. Danach prüfe ich angemeldet und im Demo-Zugang erneut im Browser: Startseite, Kalkulator, Kunden, Angebote.

## Technische Details
- `src/lib/publicDemo.ts`: `getPublicDemoTicket()` ruft `disablePublicDemoMode()` nur auf, wenn ein Ticket existiert und abgelaufen ist; kein Event-Dispatch während des Renderns ohne Ticket.
- Nebenbefund: `useAllContracts` meldet „permission denied for function is_same_tenant“. Das ist nur eine Warnung und löst den Absturz nicht aus. Ich prüfe es im selben Durchgang mit, ohne es fest einzuplanen.
