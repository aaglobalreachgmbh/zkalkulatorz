// supabase/functions/calculate-margin/index.ts
// THE ENGINE: LOGIC BLACK BOX (ACTIVATED)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Calculation Engine (Live) Ready")

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize Service Role Client (The Trust)
        // CRITICAL: We use the SERVICE_ROLE_KEY to bypass RLS on tariffs_commercial
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Server Misconfiguration: Secrets missing")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Parse Input
        const { productId, volume } = await req.json()

        if (!productId || volume <= 0) {
            throw new Error("Invalid Input: Product ID required, Volume must be positive")
        }

        console.log(`Calculation requested for Tariff: ${productId}, Vol: ${volume}`)

        // 3. Fetch Data (The Vault Lookups)
        // Parallel fetch for speed
        const [publicData, commercialData] = await Promise.all([
            supabase.from('tariffs_public').select('list_price_netto').eq('id', productId).single(),
            supabase.from('tariffs_commercial').select('cost_price_netto').eq('tariff_id', productId).single()
        ])

        if (publicData.error || !publicData.data) {
            console.error("Public Data Error:", publicData.error)
            throw new Error("Product Not Found (Public)")
        }

        if (commercialData.error || !commercialData.data) {
            console.error("Commercial Data Error:", commercialData.error)
            throw new Error("Product Pricing Unavailable (Commercial)")
        }

        const listPrice = publicData.data.list_price_netto
        const costPrice = commercialData.data.cost_price_netto

        // 4. The Math (The Black Box)
        const revenue = listPrice * volume
        const cost = costPrice * volume
        const margin = revenue - cost
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0

        // 5. Build Response (Contract Compliance)
        const result = {
            data: {
                margin: Number(margin.toFixed(2)),
                marginPercent: Number(marginPercent.toFixed(2)),
                recommendedPrice: Number(revenue.toFixed(2)),
                currency: "EUR"
            }
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Calculation Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
