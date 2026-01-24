"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalculationInputSchema, CustomerTypeEnum, type CalculationInput, type CalculationOutput } from "@/lib/contracts"
import { calculateMargin, type Product } from "@/services/calculationService"
import { WizardContainer } from "@/components/ui/wizard-container"
import { SectionPanel } from "@/components/ui/section-panel"
import { HelpTooltip } from "@/components/ui/help-tooltip"

// Mock Products (Replace with getProducts() in next step)
const MOCK_PRODUCTS: Product[] = [
    { id: "123e4567-e89b-12d3-a456-426614174000", name: "Vodafone Red Business Prime", provider: "Vodafone" },
    { id: "987e6543-e21b-12d3-a456-426614174000", name: "Data Go Business L", provider: "Vodafone" },
]

export function MarginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<CalculationOutput | null>(null)

    const form = useForm<CalculationInput>({
        resolver: zodResolver(CalculationInputSchema) as any,
        defaultValues: {
            volume: 1,
            customerType: "BUSINESS",
        }
    })

    async function onSubmit(data: CalculationInput) {
        setIsLoading(true)
        setResult(null)
        try {
            const result = await calculateMargin(data)
            setResult(result)
            toast.success("Calculation Successful")
        } catch (error) {
            console.warn(error)
            toast.error("Calculation Failed", {
                description: error instanceof Error ? error.message : "Unknown Error"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <WizardContainer
            title="Margin Calculator"
            description="Configure deal parameters."
            currentStep={1}
            totalSteps={1}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Primary Selection Panel */}
                    <SectionPanel title="Deal Configuration">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Product Selection */}
                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product <HelpTooltip content="Select the product for which you want to calculate the margin." /></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-muted/30 border-input/50 transition-colors focus:border-ring">
                                                    <SelectValue placeholder="Select a product" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MOCK_PRODUCTS.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Customer Type */}
                            <FormField
                                control={form.control}
                                name="customerType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Type <HelpTooltip content="Choose the customer type to apply relevant pricing rules." /></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-muted/30 border-input/50 transition-colors focus:border-ring">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CustomerTypeEnum.options.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Volume Input (Full Width below) */}
                        <div className="mt-6">
                            <FormField
                                control={form.control}
                                name="volume"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Volume (Sim Cards)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="h-12 text-lg tabular-nums bg-muted/30 border-input/50 transition-colors focus:border-ring" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </SectionPanel>

                    {/* Result Panel (Conditional) */}
                    {result ? (
                        <SectionPanel className="border-l-4 border-l-success bg-success/10 dark:bg-success/5 animate-fade-in-up">
                            <div className="grid grid-cols-3 gap-6 text-center">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Margin</p>
                                    <p className="text-3xl font-bold text-foreground tabular-nums mt-1 font-feature-settings-cv11">
                                        {result.margin.toFixed(2)}€
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Margin %</p>
                                    <p className="text-3xl font-bold text-foreground tabular-nums mt-1 font-feature-settings-cv11">
                                        {result.marginPercent.toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Rec. Price</p>
                                    <p className="text-3xl font-bold text-foreground tabular-nums mt-1 font-feature-settings-cv11">
                                        {result.recommendedPrice.toFixed(2)}€
                                    </p>
                                </div>
                            </div>
                        </SectionPanel>
                    ) : (
                        // Placeholder Panel to maintain layout stability
                        <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                            Result will appear here...
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                Calculating...
                            </div>
                        ) : "Calculate Margin"}
                    </Button>
                </form>
            </Form>
        </WizardContainer>
    )
}

