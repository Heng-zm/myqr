
"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2 } from "lucide-react";

export function QrGenerator() {
  const [value, setValue] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!value) {
        toast({
            variant: "destructive",
            title: "Input Required",
            description: "Please enter some text or a URL to generate a QR code.",
        });
        return;
    }
    setQrCodeData(value);
  };

  const handleDownload = () => {
    const svg = document.getElementById("QRCode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  const handleShare = async () => {
    if (navigator.share && qrCodeData) {
      try {
        await navigator.share({
            title: 'QR Code',
            text: `QR Code for: ${qrCodeData}`,
            url: window.location.href, // You can share the current URL or a specific one
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the QR code.",
        });
      }
    } else {
        toast({
            title: "Share Not Supported",
            description: "Your browser does not support the Web Share API.",
        });
    }
  }


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
        <CardDescription>Enter text or a URL to create your own QR code.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCodeData ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
                <QRCode id="QRCode" value={qrCodeData} size={256} />
            </div>
            <Button variant="outline" onClick={() => { setQrCodeData(""); setValue("")}}>
              Create Another
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="qr-content">Content</Label>
            <Textarea
              id="qr-content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. https://firebase.google.com"
              rows={4}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {qrCodeData ? (
            <>
                {navigator.share && <Button variant="outline" onClick={handleShare}><Share2 className="mr-2" />Share</Button>}
                <Button onClick={handleDownload}><Download className="mr-2" />Download</Button>
            </>
        ) : (
            <Button onClick={handleGenerate}>Generate QR Code</Button>
        )}
      </CardFooter>
    </Card>
  );
}
