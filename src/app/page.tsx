import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scanner } from "@/components/scanner";
import { Icons } from "@/components/icons";

export default function Home() {
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
            <Scanner type="QR" />
          </TabsContent>
          <TabsContent value="barcode">
            <Scanner type="Barcode" />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and ShadCN UI.</p>
      </footer>
    </div>
  );
}
