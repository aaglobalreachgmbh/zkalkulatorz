import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
    return (
        <div className={cn(
            "flex flex-col h-full w-full bg-card rounded-lg border border-border p-0 overflow-hidden",
            className
        )}>
            {/* Image Container Skeleton (Aspect 4/5 match) */}
            <div className="aspect-[4/5] w-full p-6 bg-muted/20 border-b border-border/50 flex items-center justify-center">
                <Skeleton className="h-full w-2/3 rounded-md bg-muted/40" />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 p-3 flex flex-col gap-3">
                {/* Title & Brand */}
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4 rounded-sm" />
                    <Skeleton className="h-3 w-1/2 rounded-sm" />
                </div>

                {/* Middle Spacer */}
                <div className="flex-1" />

                {/* Footer / Price Skeleton */}
                <div className="pt-3 mt-auto border-t border-border/50 flex justify-between items-center">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                </div>
            </div>
        </div>
    );
}
