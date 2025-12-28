import { MainLayout } from "@/components/MainLayout";
import { HardwareImageUploader } from "@/margenkalkulator/ui/components/HardwareImageUploader";

export default function HardwareImages() {
  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Produktbilder verwalten</h1>
          <p className="text-muted-foreground">
            Laden Sie Bilder für Ihre Hardware-Geräte hoch. Diese werden im Kalkulator-Wizard angezeigt.
          </p>
        </div>

        <HardwareImageUploader />
      </div>
    </MainLayout>
  );
}
