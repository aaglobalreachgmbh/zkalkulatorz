"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalculationInputSchema, CustomerTypeEnum, type CalculationInput, type CalculationOutput } from "@/lib/contracts"
import { calculateMargin, type Product } from "@/services/calculationService"

// Mock Products (Replace with getProducts() in next step)
const MOCK_PRODUCTS: Product[] = [
    { id: "123e4567-e89b-12d3-a456-426614174000", name: "Vodafone Red Business Prime", provider: "Vodafone" },
    { id: "987e6543-e21b-12d3-a456-426614174000", name: "Data Go Business L", provider: "Vodafone" },
]

export function MarginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<CalculationOutput | null>(null)

    const form = useForm<CalculationInput>({
        resolver: zodResolver(CalculationInputSchema),
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
        <Card className="w-full max-w-md border-t-4 border-t-vodafone-red shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-vodafone-blue">Margin Calculator</CardTitle>
                <CardDescription>Enter deal details to calculate margins.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Product Selection */}
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
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

                        {/* Volume Input */}
                        <FormField
                            control={form.control}
                            name="volume"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Volume</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} className="font-geist-mono tabular-nums" />
                                    </FormControl>
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
                                    <FormLabel>Customer Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
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

                        <Button
                            type="submit"
                            className="w-full bg-vodafone-red font-bold text-white hover:bg-red-700"
                            disabled={isLoading}
                        >
                            {isLoading ? "Calculating..." : "Calculate Margin"}
                        </Button>
                    </form>
                </Form>

                {/* Result Display */}
                {result && (
                    <div className="mt-8 rounded-lg bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Margin</p>
                                <p className="font-geist-mono text-xl font-bold text-vodafone-blue tabular-nums">
                                    {result.margin.toFixed(2)} {result.currency}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Margin %</p>
                                <p className="font-geist-mono text-xl font-bold text-vodafone-blue tabular-nums">
                                    {result.marginPercent.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Rec. Price</p>
                                <p className="font-geist-mono text-xl font-bold text-vodafone-blue tabular-nums">
                                    {result.recommendedPrice.toFixed(2)} {result.currency}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
