"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ScanLine, Copy, Check, RefreshCw } from "lucide-react";

interface ScannerProps {
  type: "QR" | "Barcode";
}

const mockData = {
  QR: "https://firebase.google.com/",
  Barcode: "8414906123456",
};

export function Scanner({ type }: ScannerProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isLoading]);

  const handleScan = () => {
    setIsLoading(true);
    setScanResult(null);
    setTimeout(() => {
      setScanResult(mockData[type] + (type === 'QR' ? `?time=${Date.now()}` : `-${Math.floor(Math.random() * 900 + 100)}`));
      setIsLoading(false);
    }, 2200);
  };

  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: scanResult,
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setProgress(0);
  };
  
  const Icon = type === 'QR' ? QrCode : ScanLine;

  if (scanResult) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>{type} Scan Result</CardTitle>
          <CardDescription>The following data was successfully scanned.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="break-all rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground">{scanResult}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleScanAgain}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Again
          </Button>
          <Button onClick={handleCopy} disabled={isCopied}>
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-6 pt-8">
        <div className="relative mb-6 flex h-48 w-48 items-center justify-center rounded-lg border-4 border-dashed border-primary/20 bg-primary/5">
          <Icon className="h-24 w-24 text-primary/50" />
          {isLoading && (
             <div className="absolute bottom-4 left-4 right-4">
               <Progress value={progress} className="h-2 w-full" />
               <p className="mt-1 text-center text-xs text-primary">Scanning...</p>
             </div>
          )}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Ready to Scan</h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Position the {type} code inside the frame and press the button to start scanning.
        </p>
        <Button onClick={handleScan} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Processing..." : `Start ${type} Scan`}
        </Button>
      </CardContent>
    </Card>
  );
}
