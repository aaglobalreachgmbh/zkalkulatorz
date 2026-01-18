import { Toaster } from "sonner";
import { MarginForm } from "@/components/calculator/MarginForm";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-vodafone-blue p-4 text-white">
      <div className="flex flex-col items-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tighter">
          Margen<span className="text-vodafone-red">Kalkulator</span>
        </h1>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-vodafone-red"></div>
          <span className="font-mono text-sm uppercase tracking-widest text-gray-400">
            System Online
          </span>
        </div>

        {/* The Calculator Interface */}
        <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
          <MarginForm />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded border border-white/10 p-4">
            <p className="text-xs text-gray-400">Architecture</p>
            <p className="font-mono text-sm">Event-Driven</p>
          </div>
          <div className="rounded border border-white/10 p-4">
            <p className="text-xs text-gray-400">Security</p>
            <p className="font-mono text-sm">Active Defense</p>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
