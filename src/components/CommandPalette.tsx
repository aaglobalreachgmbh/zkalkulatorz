import * as React from "react";
import {
    Calculator,
    CreditCard,
    Settings,
    User,
    Search,
    LayoutGrid,
    Smartphone,
    Wifi,
    FileText
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useDensity } from "@/contexts/DensityContext";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();
    const { toggleDensity } = useDensity();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Suche nach Funktionen..." />
            <CommandList>
                <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate("/calculator"))}>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Kalkulator</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/offers"))}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Angebote</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/customers"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Kunden</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Ansicht & Tools">
                    <CommandItem onSelect={() => runCommand(() => toggleDensity())}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Dichte umschalten (Kompakt/Standard)</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
