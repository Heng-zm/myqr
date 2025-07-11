
"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2, Bot, Loader2, RefreshCw } from "lucide-react";
import { generateImage, GenerateImageOutput } from "@/ai/flows/generate-image-flow";
import Image from "next/image";

export function QrGenerator() {
  const [value, setValue] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GenerateImageOutput | null>(null);

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
    setGeneratedImage(null);
  };

  const handleGenerateImage = async () => {
    if (!qrCodeData) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    try {
      const result = await generateImage({ prompt: qrCodeData });
      setGeneratedImage(result);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: "Could not generate an AI image for your QR code.",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById("QRCode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
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
            url: window.location.href,
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
  
  const handleReset = () => {
    setValue("");
    setQrCodeData("");
    setGeneratedImage(null);
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
        <CardDescription>Enter text or a URL to create your own QR code. You can even generate a unique AI image to go with it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCodeData ? (
          <div className="flex flex-col items-center justify-center space-y-4">
             {generatedImage ? (
                <Image
                  src={generatedImage.imageUrl}
                  alt="AI generated image"
                  width={288}
                  height={288}
                  className="rounded-lg border aspect-square object-cover"
                />
             ) : isGeneratingImage ? (
                <div className="flex flex-col items-center justify-center h-72 w-72 rounded-lg border bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Generating your image...</p>
                </div>
             ) : (
                <div className="bg-white p-4 rounded-lg border h-72 w-72 flex items-center justify-center">
                    <QRCode id="QRCode" value={qrCodeData} size={256} />
                </div>
             )}

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw /> Create Another
              </Button>
              {!generatedImage && (
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>
                  {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Bot />}
                  {isGeneratingImage ? 'Generating...' : 'Generate AI Image'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="qr-content">Content</Label>
            <Textarea
              id="qr-content"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. A journey of a thousand miles begins with a single step."
              rows={4}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {qrCodeData && !generatedImage ? (
            <>
                {navigator.share && <Button variant="outline" onClick={handleShare}><Share2 />Share</Button>}
                <Button onClick={handleDownload}><Download />Download QR</Button>
            </>
        ) : !qrCodeData ? (
            <Button onClick={handleGenerate}>Generate QR Code</Button>
        ) : null }
      </CardFooter>
    </Card>
  );
}
