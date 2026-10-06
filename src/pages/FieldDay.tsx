import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoPageShell } from "@/components/workspace/DemoPageShell";
import { DEMO_APPOINTMENTS } from "@/margenkalkulator/workspace/demoData";

function SignaturePad({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) { ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = getComputedStyle(document.body).color; }
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={ref} width={420} height={140}
        className="w-full rounded-lg border border-border bg-background touch-none"
        onPointerDown={(e) => { drawing.current = true; const p = pos(e); const c = ref.current?.getContext("2d"); c?.beginPath(); c?.moveTo(p.x, p.y); }}
        onPointerMove={(e) => { if (!drawing.current) return; const p = pos(e); const c = ref.current?.getContext("2d"); c?.lineTo(p.x, p.y); c?.stroke(); }}
        onPointerUp={() => { drawing.current = false; }}
      />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { const c = ref.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height); }}>Löschen</Button>
        <Button size="sm" onClick={onDone}>Unterschrift übernehmen (Demo)</Button>
      </div>
    </div>
  );
}

export default function FieldDay() {
  const navigate = useNavigate();
  const [done, setDone] = useState<string[]>([]);
  const [signingFor, setSigningFor] = useState<string | null>(null);

  return (
    <DemoPageShell title="Mein Außendienst-Tag" description="Termine, Angebot vor Ort und Unterschrift beim Kunden.">
      <div className="space-y-3">
        {DEMO_APPOINTMENTS.map((a) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{a.time} · {a.customer}</span>
                {done.includes(a.id) && <Badge variant="secondary">Unterschrieben</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{a.address}</div>
              <div className="text-sm text-foreground">{a.topic}</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`} target="_blank" rel="noreferrer">Route</a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/calculator")}>Angebot erstellen</Button>
                <Button size="sm" onClick={() => setSigningFor(a.id)}>Unterschrift</Button>
              </div>
              {signingFor === a.id && (
                <SignaturePad onDone={() => { setDone((d) => [...d, a.id]); setSigningFor(null); toast.success("Demo: Unterschrift gespeichert"); }} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DemoPageShell>
  );
}
