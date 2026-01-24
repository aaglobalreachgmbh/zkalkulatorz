"use client";

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend // Fix: Add Legend import
} from 'recharts'; // Fix: Import from recharts main package
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface ChartData {
    day: string;
    event: string;
    count: number;
}

export function ActivityChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Fetch from the View
            const { data: rawData, error } = await supabase
                .from('vw_usage_summary')
                .select('*')
                .order('day', { ascending: true })
                .limit(30); // Last 30 entries

            if (error) {
                console.error("Failed to fetch activity:", error);
                setLoading(false);
                return;
            }

            // Process data for Recharts (Pivot counting)
            // Format: { day: '2024-01-01', pdf_export: 12, calculation: 45 }
            const processed = (rawData || []).reduce((acc: any[], curr: ChartData) => {
                const date = new Date(curr.day).toLocaleDateString('de-DE');
                const existing = acc.find(item => item.day === date);
                if (existing) {
                    existing[curr.event] = curr.count;
                } else {
                    acc.push({ day: date, [curr.event]: curr.count });
                }
                return acc;
            }, []);

            setData(processed);
            setLoading(false);
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex justify-center items-center h-full text-slate-400 text-sm">
                Keine Daten verfügbar.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="calculation" fill="#3b82f6" name="Berechnungen" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pdf_export" fill="#10b981" name="PDF Exports" radius={[4, 4, 0, 0]} />
                <Bar dataKey="login" fill="#6366f1" name="Logins" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
