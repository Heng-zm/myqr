
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Barcode, Clock, QrCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface HistoryItem {
  content: string;
  type: "QR" | "Barcode";
  timestamp: string;
}

interface ScanHistoryProps {
  items: HistoryItem[];
}

export function ScanHistory({ items }: ScanHistoryProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[240px]">
          <div className="p-4 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1">
                  {item.type === "QR" ? (
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Barcode className="h-5 w-5 text-muted-foreground" />
                  )}
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
