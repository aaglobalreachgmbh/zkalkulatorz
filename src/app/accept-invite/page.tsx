import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Public page to accept invite
// Real implementation would have a form to set password, 
// then call a Server Action that:
// 1. Creates Auth User (signUp)
// 2. Marks token accepted
// 3. Assigns Role
// For simplicity in this demo, we just show a "Join" button that redirects to Sign Up page with params,
// or a message.
export default async function AcceptInvitePage({ searchParams }: { searchParams: { token?: string } }) {
    const { token } = await searchParams; // Next.js 15 breaking: params are promises

    if (!token) return <p>Invalid Link</p>;

    // Verify token (Server Side)
    const supabase = await createClient();
    // Use service role if needed, but here we likely only have anon client if not logged in.
    // We need a specific action to validate.
    // For now, let's assume valid and guide user.

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Join the Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-slate-600">
                        You have been invited! Please sign up to activate your account.
                    </p>
                    <div className="bg-slate-100 p-2 rounded mb-4 font-mono text-xs break-all">
                        Token: {token}
                    </div>
                    <Button asChild className="w-full">
                        <Link href={`/login?items=invite&token=${token}`}>Continue to Login/Register</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
