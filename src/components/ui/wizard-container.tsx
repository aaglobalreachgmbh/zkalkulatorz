import * as React from "react"
import { cn } from "@/lib/utils"
import { TOKENS } from "@/lib/tokens"

interface WizardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    currentStep?: number
    totalSteps?: number
}

export function WizardContainer({
    title,
    description,
    currentStep,
    totalSteps,
    className,
    children,
    ...props
}: WizardContainerProps) {
    return (
        <div
            className={cn(
                "flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto", // Viewport height minus header
                "bg-white dark:bg-slate-900",
                "rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800",
                className
            )}
            {...props}
        >
            {/* Header */}
            <header className="flex-none p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 backdrop-blur-sm z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Step Indicator */}
                    {currentStep && totalSteps && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Step {currentStep} of {totalSteps}
                            </span>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-600 transition-all duration-500 ease-out"
                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Footer (Actions) - Sticky is handled by parent flex layout */}
            {/* Actions are typically injected here via slots or children if needed globally */}
        </div>
    )
}
