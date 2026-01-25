import { Maximize2, Minimize2, Rows, Grid } from "lucide-react";
import { useDensity } from "@/contexts/DensityContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DensityToggle() {
    const { density, toggleDensity } = useDensity();
    const isCompact = density === "compact";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDensity}
                    className={cn(
                        "h-9 w-9 transition-all text-muted-foreground",
                        isCompact ? "text-primary bg-primary/10" : "hover:text-foreground"
                    )}
                >
                    {isCompact ? (
                        <Rows className="h-4 w-4" />
                    ) : (
                        <Grid className="h-4 w-4" />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isCompact ? "Kompaktansicht aktiv" : "Standardansicht aktiv"}</p>
                <p className="text-[10px] text-muted-foreground">Klicken zum Wechseln</p>
            </TooltipContent>
        </Tooltip>
    );
}
