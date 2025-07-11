
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Barcode, Clock, QrCode, Wand2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface HistoryItem {
  content: string;
  type: "QR" | "Barcode" | "Generated";
  timestamp: string;
}

interface ScanHistoryProps {
  items: HistoryItem[];
}

export function ScanHistory({ items }: ScanHistoryProps) {
    const getIcon = (type: HistoryItem['type']) => {
        switch (type) {
            case 'QR':
                return <QrCode className="h-5 w-5 text-muted-foreground" />;
            case 'Barcode':
                return <Barcode className="h-5 w-5 text-muted-foreground" />;
            case 'Generated':
                return <Wand2 className="h-5 w-5 text-muted-foreground" />;
            default:
                return <QrCode className="h-5 w-5 text-muted-foreground" />;
        }
    }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[240px]">
          <div className="p-4 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="break-all font-mono text-sm">{item.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
