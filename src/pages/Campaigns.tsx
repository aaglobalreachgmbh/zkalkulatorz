import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { DEMO_CUSTOMERS } from "@/margenkalkulator/workspace/demoData";
import { cn } from "@/lib/utils";

type Channel = "email" | "sms" | "whatsapp";
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "E-Mail" }, { id: "sms", label: "SMS" }, { id: "whatsapp", label: "WhatsApp" },
];
const DEFAULT_TEXT = "Hallo {Name}, Ihre Vertragsverlängerung steht in {Tage} Tagen an. Wir haben ein passendes Angebot für Sie – sollen wir einen Termin vereinbaren?";

export default function Campaigns() {
  const due = useMemo(() => DEMO_CUSTOMERS.filter((c) => c.vvlInDays <= 90).sort((a, b) => a.vvlInDays - b.vvlInDays), []);
  const [selected, setSelected] = useState<string[]>(due.map((c) => c.id));
  const [channel, setChannel] = useState<Channel>("email");
  const [text, setText] = useState(DEFAULT_TEXT);
  const first = due.find((c) => selected.includes(c.id));

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <DemoPageShell title="VVL-Kampagnen" description="Fällige Bestandskunden auswählen und gesammelt ansprechen. Es wird nichts versendet.">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle className="text-base">Fällig in den nächsten 90 Tagen ({due.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {due.map((c) => (
              <label key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.contact} · {c.tariff}</div>
                </div>
                <span className={cn("text-xs font-medium", c.vvlInDays <= 30 ? "text-destructive" : "text-muted-foreground")}>
                  {c.vvlInDays} Tage
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Nachricht</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <Button key={ch.id} size="sm" variant={channel === ch.id ? "default" : "outline"} onClick={() => setChannel(ch.id)}>{ch.label}</Button>
              ))}
            </div>
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
            {first && (
              <div className="rounded-lg bg-muted p-3 text-sm text-foreground">
                <div className="text-xs text-muted-foreground mb-1">Vorschau für {first.contact}</div>
                {text.replace("{Name}", first.contact).replace("{Tage}", String(first.vvlInDays))}
              </div>
            )}
            <Button className="w-full" disabled={selected.length === 0}
              onClick={() => toast.success(`Demo: ${selected.length} Nachrichten per ${CHANNELS.find((c) => c.id === channel)?.label} vorbereitet`)}>
              An {selected.length} Kunden senden (Demo)
            </Button>
          </CardContent>
        </Card>
      </div>
    </DemoPageShell>
  );
}
