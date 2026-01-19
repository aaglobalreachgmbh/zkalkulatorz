import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    action?: React.ReactNode
}

export function SectionPanel({
    title,
    action,
    className,
    children,
    ...props
}: SectionPanelProps) {
    return (
        <section
            className={cn(
                "group relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:shadow-md",
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    {title && (
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                    )}
                    {action && <div className="flex-shrink-0 ml-4">{action}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>

            {/* Decorative Red Line on Left (Vodafone Touch) */}
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-red-600/0 group-hover:bg-red-600/100 transition-all duration-300 rounded-r-full" />
        </section>
    )
}
