import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, Mail, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Datenschutzhinweis für interne B2B-Anwendung
 * Erfüllt Art. 13/14 DSGVO Mindestanforderungen
 * Stand: Dezember 2025
 */
export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = "26. Dezember 2025";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Datenschutzhinweis</h1>
              <p className="text-sm text-muted-foreground">
                Stand: {lastUpdated}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Zurück
          </Button>
        </div>

        {/* Verantwortlicher */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verantwortlicher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist der
              Betreiber dieser internen Anwendung. Bei Fragen zum Datenschutz
              wenden Sie sich bitte an Ihren Vorgesetzten oder die
              Datenschutz-Ansprechperson Ihres Unternehmens.
            </p>
          </CardContent>
        </Card>

        {/* Zweck der Datenverarbeitung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Zweck der Datenverarbeitung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Diese interne Anwendung (MargenKalkulator) dient ausschließlich der
              Geschäftsabwicklung für autorisierte Vodafone Business Partner.
              Folgende Daten werden verarbeitet:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Authentifizierungsdaten:</strong> E-Mail-Adresse,
                Anzeigename (für Login und Benutzerverwaltung)
              </li>
              <li>
                <strong>Nutzungsdaten:</strong> Erstellte Angebote,
                Konfigurationen, Aktivitätsprotokoll
              </li>
              <li>
                <strong>Kundendaten:</strong> Firmenname, Kontaktdaten (nur bei
                Angebotsverknüpfung)
              </li>
              <li>
                <strong>Sicherheitsdaten:</strong> Gehashte IP-Adressen,
                Sitzungsinformationen (zum Schutz vor Missbrauch)
              </li>
            </ul>
            <p className="text-muted-foreground">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an IT-Sicherheit)
            </p>
          </CardContent>
        </Card>

        {/* Datensicherheit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Datensicherheit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Wir setzen technische und organisatorische Maßnahmen ein:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Verschlüsselte Übertragung (TLS/HTTPS)</li>
              <li>Zugriffskontrolle durch Authentifizierung</li>
              <li>Rollenbasierte Berechtigungen (RBAC)</li>
              <li>Sicherheitsüberwachung und Anomalie-Erkennung</li>
              <li>Regelmäßige Sicherheitsaudits</li>
              <li>IP-Hashing statt Klartext-Speicherung</li>
            </ul>
          </CardContent>
        </Card>

        {/* Speicherdauer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Speicherdauer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Benutzerkonto:</strong> Solange die Geschäftsbeziehung
                besteht, danach Löschung oder Anonymisierung
              </li>
              <li>
                <strong>Angebotsdaten:</strong> Gemäß gesetzlicher
                Aufbewahrungsfristen (i.d.R. 10 Jahre für steuerrelevante
                Dokumente)
              </li>
              <li>
                <strong>Sicherheitsprotokolle:</strong> Maximal 90 Tage, sofern
                nicht für Untersuchungen benötigt
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Ihre Rechte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Ihre Rechte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Sie haben folgende Rechte gemäß DSGVO:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Auskunft (Art. 15):</strong> Welche Daten über Sie
                gespeichert sind
              </li>
              <li>
                <strong>Berichtigung (Art. 16):</strong> Korrektur unrichtiger
                Daten
              </li>
              <li>
                <strong>Löschung (Art. 17):</strong> Löschung Ihrer Daten, sofern
                keine Aufbewahrungspflichten entgegenstehen
              </li>
              <li>
                <strong>Einschränkung (Art. 18):</strong> Einschränkung der
                Verarbeitung
              </li>
              <li>
                <strong>Datenübertragbarkeit (Art. 20):</strong> Export Ihrer
                Daten in maschinenlesbarem Format
              </li>
              <li>
                <strong>Widerspruch (Art. 21):</strong> Widerspruch gegen
                Verarbeitung auf Basis berechtigter Interessen
              </li>
            </ul>
            <p className="text-muted-foreground">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an Ihren
              Vorgesetzten oder die Datenschutz-Ansprechperson.
            </p>
          </CardContent>
        </Card>

        {/* Keine Weitergabe an Dritte */}
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Keine Weitergabe an Dritte
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Ihre Daten werden nicht an Dritte verkauft oder für Werbezwecke
                  verwendet. Eine Weitergabe erfolgt nur an technische
                  Dienstleister (Hosting, Infrastruktur) im Rahmen der
                  Auftragsverarbeitung nach Art. 28 DSGVO.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>
            Diese Datenschutzhinweise entsprechen den Anforderungen der DSGVO
            (Stand: {lastUpdated})
          </p>
          <p className="mt-1">
            Bei Änderungen werden Sie über die Anwendung informiert.
          </p>
        </div>
      </div>
    </div>
  );
}
