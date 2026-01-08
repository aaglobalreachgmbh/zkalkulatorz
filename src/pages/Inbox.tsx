import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Inbox as InboxIcon, 
  Upload, 
  Link2, 
  Eye, 
  FileText, 
  Image, 
  File,
  FileSpreadsheet
} from "lucide-react";

// Mock-Daten für ungesichtete Uploads
const MOCK_UPLOADS = [
  { 
    id: "1", 
    name: "Rahmenvertrag_Vodafone.pdf", 
    type: "pdf", 
    size: "2.4 MB", 
    uploadedAt: "Heute 09:15", 
    status: "neu" 
  },
  { 
    id: "2", 
    name: "Hardware_EK_Januar.xlsx", 
    type: "xlsx", 
    size: "156 KB", 
    uploadedAt: "Gestern", 
    status: "neu" 
  },
  { 
    id: "3", 
    name: "Kundenlogo_Musterfirma.png", 
    type: "image", 
    size: "89 KB", 
    uploadedAt: "03.01.2026", 
    status: "neu" 
  },
];

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />;
    case "xlsx":
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case "image":
      return <Image className="w-5 h-5 text-blue-500" />;
    default:
      return <File className="w-5 h-5 text-muted-foreground" />;
  }
}

export default function InboxPage() {
  const [uploads] = useState(MOCK_UPLOADS);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // TODO: Handle file drop
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Posteingang</h1>
            <p className="text-muted-foreground">
              Zentrale Ablage für eingehende Dokumente
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {uploads.length} ungesichtet
          </Badge>
        </div>

        {/* Dropzone */}
        <Card 
          className={`border-dashed border-2 transition-colors cursor-pointer ${
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <CardContent className="py-12 text-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              isDragOver ? "text-primary" : "text-muted-foreground"
            }`} />
            <p className="text-lg font-medium">Dateien hier ablegen</p>
            <p className="text-sm text-muted-foreground">
              oder klicken zum Auswählen
            </p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload" 
              multiple 
            />
            <Button variant="outline" className="mt-4">
              Dateien auswählen
            </Button>
          </CardContent>
        </Card>

        {/* Ungesichtete Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InboxIcon className="w-5 h-5" />
              Ungesichtete Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Keine ungesichteten Dokumente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploads.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(item.type)}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} • {item.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="Anzeigen">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Zuordnen">
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
