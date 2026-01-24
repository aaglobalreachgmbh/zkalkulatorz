import { supabase } from '@/lib/supabase'
import { CalculationInputSchema, CalculationOutputSchema, type CalculationInput, type CalculationOutput } from '@/lib/contracts'

export interface Product {
    id: string
    name: string
    provider: string
}

export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('tariffs_public')
        .select('id, name, provider')

    if (error) {
        console.error('Error fetching products:', error)
        throw new Error('Failed to fetch products')
    }

    return data || []
}

export async function calculateMargin(input: CalculationInput): Promise<CalculationOutput> {
    // 1. Client-Side Validation (The Judge)
    const valid = CalculationInputSchema.safeParse(input)
    if (!valid.success) {
        throw new Error(`Invalid Input: ${valid.error.message}`)
    }

    // 2. Invoke Edge Function (The Engine)
    const { data, error } = await supabase.functions.invoke('calculate-margin', {
        body: valid.data
    })

    if (error) {
        console.error('Edge Function Error:', error)
        throw new Error('Calculation Engine Failed')
    }

    // 3. Validate Response (The Trust)
    const outputValid = CalculationOutputSchema.safeParse(data.data) // Assuming { status: "success", data: { ... } } structure from Engine
    if (!outputValid.success) {
        console.error('Invalid Engine Response:', data)
        throw new Error('Engine returned Malformed Data')
    }

    return outputValid.data
}
