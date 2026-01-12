import { ReactNode } from "react";

interface GuardProps {
    children: ReactNode;
    fallback?: ReactNode;
    /**
     * The current view mode of the application.
     * Must be passed explicitly to ensure strict control.
     */
    viewMode: "customer" | "dealer";
}

/**
 * Renders content ONLY when in Dealer Mode.
 * Returns NULL (no DOM) when in Customer Mode.
 */
export function DealerOnly({ children, fallback = null, viewMode }: GuardProps) {
    if (viewMode === "customer") {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Renders content ONLY when in Customer Mode.
 */
export function CustomerOnly({ children, fallback = null, viewMode }: GuardProps) {
    if (viewMode !== "customer") {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
