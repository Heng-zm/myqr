
"use client";

import React, { useState, Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { ScanHistory } from "@/components/scan-history";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { HistoryProvider, useHistory } from "@/context/history-context";

// Lazy load components
const QrGenerator = lazy(() => import("@/components/qr-generator").then(module => ({ default: module.QrGenerator })));
const Scanner = lazy(() => import("@/components/scanner").then(module => ({ default: module.Scanner })));

function HomeComponent() {
  const { history, clearHistory } = useHistory();

  const handleExportHistory = () => {
    if (history.length === 0) return;
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

  const renderSuspenseFallback = () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

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
          <Suspense fallback={renderSuspenseFallback()}>
            <TabsContent value="qr">
              <Scanner type="QR" />
            </TabsContent>
            <TabsContent value="barcode">
              <Scanner type="Barcode" />
            </TabsContent>
            <TabsContent value="generate">
              <QrGenerator />
            </TabsContent>
          </Suspense>
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
                <Button variant="outline" size="sm" onClick={clearHistory}>
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

export default function Home() {
  return (
    <HistoryProvider>
      <HomeComponent />
    </HistoryProvider>
  )
}
