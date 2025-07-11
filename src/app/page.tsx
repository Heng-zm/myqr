
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scanner } from "@/components/scanner";
import { Icons } from "@/components/icons";
import { ScanHistory, type HistoryItem } from "@/components/scan-history";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("scanHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not load scan history from localStorage", error);
    }
  }, []);

  const handleScan = (newItem: HistoryItem) => {
    setHistory((prevHistory) => {
      const newHistory = [newItem, ...prevHistory].slice(0, 50); // Keep last 50 scans
      try {
        localStorage.setItem("scanHistory", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Could not save scan history to localStorage", error);
      }
      return newHistory;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("scanHistory");
    } catch (error) {
      console.error("Could not clear scan history from localStorage", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-3 text-center">
        <Icons.logo className="h-10 w-10 text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
          CodeScan
        </h1>
      </header>
      <main className="w-full max-w-2xl">
        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
          </TabsList>
          <TabsContent value="qr">
            <Scanner type="QR" onScan={handleScan} />
          </TabsContent>
          <TabsContent value="barcode">
            <Scanner type="Barcode" onScan={handleScan} />
          </TabsContent>
        </Tabs>

        {history.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                Clear History
              </Button>
            </div>
            <ScanHistory items={history} />
          </div>
        )}
      </main>
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and ShadCN UI.</p>
      </footer>
    </div>
  );
}
