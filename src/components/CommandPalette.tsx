import * as React from "react";
import {
    Calculator,
    Settings,
    User,
    LayoutGrid,
    FileText,
    House,
    ClipboardList,
    CalendarDays,
    Package,
    Inbox,
    BarChart3,
    Users,
    FlaskConical,
    Building2,
    Shield,
    HardDrive,
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { useDensity } from "@/contexts/DensityContext";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useTenantAdmin } from "@/hooks/useTenantAdmin";
import { useUserRole } from "@/hooks/useUserRole";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();
    const { toggleDensity } = useDensity();
    const demo = useDemoMode();
    const { isTenantAdmin } = useTenantAdmin();
    const { isAdmin } = useUserRole();

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
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <House className="mr-2 h-4 w-4" />
                        <span>Start & Übersicht</span>
                    </CommandItem>
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
                    <CommandItem onSelect={() => runCommand(() => navigate("/contracts"))}>
                        <ClipboardList className="mr-2 h-4 w-4" /><span>Verträge & VVL</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Werkzeuge">
                    <CommandItem onSelect={() => runCommand(() => navigate("/calendar"))}><CalendarDays className="mr-2 h-4 w-4" /><span>Kalender</span></CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/bundles"))}><Package className="mr-2 h-4 w-4" /><span>Bundles</span></CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/eigene-produkte"))}><Package className="mr-2 h-4 w-4" /><span>Eigene Produkte</span></CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/inbox"))}><Inbox className="mr-2 h-4 w-4" /><span>Posteingang</span></CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/reporting"))}><BarChart3 className="mr-2 h-4 w-4" /><span>Auswertungen</span></CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/team"))}><Users className="mr-2 h-4 w-4" /><span>Team</span></CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Ansicht & Tools">
                    <CommandItem onSelect={() => runCommand(() => navigate("/settings/workspace"))}>
                        <Settings className="mr-2 h-4 w-4" /><span>Arbeitsplatz anpassen</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => demo.setDemo(!demo.enabled))}>
                        <FlaskConical className="mr-2 h-4 w-4" /><span>{demo.enabled ? "Demo-Modus beenden" : "Demo-Modus starten"}</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => toggleDensity())}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Dichte umschalten (Kompakt/Standard)</span>
                    </CommandItem>
                </CommandGroup>

                {(isTenantAdmin || isAdmin || demo.enabled) && <>
                    <CommandSeparator />
                    <CommandGroup heading="Verwaltung">
                        <CommandItem onSelect={() => runCommand(() => navigate("/tenant-admin"))}><Building2 className="mr-2 h-4 w-4" /><span>Shop-Verwaltung</span></CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/admin/permissions"))}><Shield className="mr-2 h-4 w-4" /><span>Mitarbeiter-Rechte</span></CommandItem>
                        {(isAdmin || demo.enabled) && <CommandItem onSelect={() => runCommand(() => navigate("/super-admin"))}><Building2 className="mr-2 h-4 w-4" /><span>Alle Shops</span></CommandItem>}
                        {(isAdmin || demo.enabled) && <CommandItem onSelect={() => runCommand(() => navigate("/data-manager"))}><HardDrive className="mr-2 h-4 w-4" /><span>Datenmanager</span></CommandItem>}
                    </CommandGroup>
                </>}
            </CommandList>
        </CommandDialog>
    );
}
