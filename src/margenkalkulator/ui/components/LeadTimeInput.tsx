import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { CalendarClock, CheckCircle } from "lucide-react";

interface LeadTimeInputProps {
    value: number;
    onChange: (value: number) => void;
}

export function LeadTimeInput({ value, onChange }: LeadTimeInputProps) {
    const isDgrvTriggered = value >= 7;

    return (
        <div className="bg-card rounded-xl border border-border p-6 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-1">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                        <CalendarClock className="w-5 h-5 text-muted-foreground" />
                        Vorlaufzeit (Monate)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Wie viele Monate liegt der Vertragsstart in der Zukunft?
                        <br />
                        (Relevant für DGRV-Konditionen)
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="max-w-[120px]">
                        <Input
                            type="number"
                            min={0}
                            max={24}
                            value={value || 0}
                            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                            className="text-lg font-bold text-center h-12"
                        />
                    </div>

                    {isDgrvTriggered && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-right-4">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-sm">DGRV Aktiv</p>
                                <p className="text-xs">12 Monate Basispreis-frei</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
