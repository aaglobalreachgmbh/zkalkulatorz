import { Button } from "@/components/ui/button";
import { OfferOptionMeta } from "@/margenkalkulator";
import { Briefcase, ShoppingBag, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type PortfolioType = "business" | "consumer_smart" | "consumer_gigamobil";

interface PortfolioSelectorProps {
    value: PortfolioType;
    onChange: (value: PortfolioType) => void;
}

export function PortfolioSelector({ value, onChange }: PortfolioSelectorProps) {
    const options: { id: PortfolioType; label: string; subLabel: string; icon: any; color: string }[] = [
        {
            id: "business",
            label: "Business Prime",
            subLabel: "SOHO & Mittelstand (Netto)",
            icon: Briefcase,
            color: "bg-blue-600",
        },
        {
            id: "consumer_smart",
            label: "Smart Tarife",
            subLabel: "Fachhandel / Retail (Brutto)",
            icon: ShoppingBag,
            color: "bg-emerald-600",
        },
        {
            id: "consumer_gigamobil",
            label: "GigaMobil",
            subLabel: "Premium Privat (Brutto)",
            icon: Radio,
            color: "bg-red-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {options.map((option) => {
                const isSelected = value === option.id;
                const Icon = option.icon;

                return (
                    <div
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ease-out",
                            "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                            isSelected
                                ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
                                : "border-border bg-card hover:border-primary/30"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg text-white ${option.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{option.label}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{option.subLabel}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
