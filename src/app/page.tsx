
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scanner } from "@/components/scanner";
import { QrGenerator } from "@/components/qr-generator";
import { Icons } from "@/components/icons";
import { ScanHistory, type HistoryItem } from "@/components/scan-history";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

  const handleNewHistoryItem = (newItem: HistoryItem) => {
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

  const handleExportHistory = () => {
    const csvHeader = "Type,Content,Timestamp\n";
    const csvRows = history
      .map((item) => {
        const content = `"${item.content.replace(/"/g, '""')}"`; // Escape double quotes
        return [item.type, content, item.timestamp].join(",");
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "codescan_history.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-2xl">
        <header className="mb-8 flex items-center gap-3 text-left">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <Icons.logo className="h-8 w-8 " />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
              CodeScan
            </h1>
            <p className="text-muted-foreground">A smart QR and Barcode scanner.</p>
          </div>
        </header>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="qr">Scan QR</TabsTrigger>
            <TabsTrigger value="barcode">Scan Barcode</TabsTrigger>
            <TabsTrigger value="generate">Generate QR</TabsTrigger>
          </TabsList>
          <TabsContent value="qr">
            <Scanner type="QR" onScan={handleNewHistoryItem} />
          </TabsContent>
          <TabsContent value="barcode">
            <Scanner type="Barcode" onScan={handleNewHistoryItem} />
          </TabsContent>
          <TabsContent value="generate">
            <QrGenerator onGenerate={handleNewHistoryItem}/>
          </TabsContent>
        </Tabs>

        {history.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={handleExportHistory}>
                   <Download className="mr-2 h-4 w-4" />
                   Export CSV
                 </Button>
                <Button variant="outline" size="sm" onClick={handleClearHistory}>
                  Clear History
                </Button>
              </div>
            </div>
            <ScanHistory items={history} />
          </div>
        )}
      </main>
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Firebase.</p>
      </footer>
    </div>
  );
}
