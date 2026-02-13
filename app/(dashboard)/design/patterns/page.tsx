"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Wand2, Loader2, Maximize2, Download, X, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { downloadImage } from "@/lib/utils"

const INITIAL_PATTERNS = [
  { id: 1, url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?fit=crop&w=400&q=80", prompt: "Victorian Floral" },
  { id: 2, url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?fit=crop&w=400&q=80", prompt: "Abstract Watercolor" },
  { id: 3, url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?fit=crop&w=400&q=80", prompt: "Geometric Minimal" },
  { id: 4, url: "https://images.unsplash.com/photo-1620619767323-b95a89183081?fit=crop&w=400&q=80", prompt: "Terrazzo" },
  { id: 5, url: "https://images.unsplash.com/photo-1532188978303-48ed530597d6?fit=crop&w=400&q=80", prompt: "Checks and Tartan" },
  { id: 6, url: "https://images.unsplash.com/photo-1621255767222-316499691df0?fit=crop&w=400&q=80", prompt: "Leopard Print" },
]

function PatternsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("modelId");
  const { addProject, deductCredits, models } = useProjects();
  const activeModel = models.find(m => m.id === modelId);
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [patterns, setPatterns] = useState(INITIAL_PATTERNS)

  const handleGenerate = async () => {
    if (!prompt) return;
    if (!deductCredits(1)) {
      toast.error(t("common.insufficientCredits") || "Insufficient Credits");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || t("patterns.generationFailed") || "Generation failed");
        return;
      }

      if (data.imageUrl) {
        toast.success(t("patterns.generated") || "Pattern Generated!");
        const newPattern = { id: Date.now(), url: data.imageUrl, prompt: prompt };
        setPatterns([newPattern, ...patterns]);
        addProject({ title: prompt.slice(0, 30), type: "Pattern", imageUrl: data.imageUrl, description: prompt });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] p-6 gap-6">
      <div className="flex flex-col items-center justify-center py-8 space-y-4 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("patterns.title")}</h1>
        <p className="text-muted-foreground text-center">{t("patterns.subtitle")}</p>

        {activeModel && (
          <div className="bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3 flex items-center justify-between w-full max-w-lg mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">{t("train.usingModel") || "Using Model"}</p>
                <p className="text-xs text-violet-700 dark:text-violet-300">{activeModel.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => router.push('/design/patterns')}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div className="flex w-full gap-2">
          <Input
            placeholder={t("patterns.promptPlaceholder")}
            className="h-12 text-lg shadow-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <Button size="lg" className="h-12 px-8 bg-violet-500 text-white hover:bg-violet-600" onClick={handleGenerate} disabled={isGenerating || !prompt}>
            {isGenerating ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <Wand2 className="mr-2 w-5 h-5" />}
            {t("styles.generate")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-12">
        {patterns.map((p) => (
          <Dialog key={p.id}>
            <DialogTrigger className="w-full p-0 bg-transparent border-none p-0">
              <Card className="group cursor-pointer overflow-hidden aspect-square relative border-0 shadow-sm hover:shadow-md transition-all">
                <img src={p.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="text-white w-6 h-6" />
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-card">
              <DialogTitle className="sr-only">Pattern Preview</DialogTitle>
              <div className="flex-1 overflow-hidden relative group/tile">
                <div className="w-full h-full" style={{ backgroundImage: `url(${p.url})`, backgroundSize: '300px', backgroundRepeat: 'repeat' }} />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md opacity-0 group-hover/tile:opacity-100 transition-opacity">
                  {t("patterns.tilingPreview") || "Seamless Tiling Preview"}
                </div>
              </div>
              <div className="p-4 bg-background border-t border-card flex justify-between items-center">
                <div className="text-white font-medium">{p.prompt}</div>
                <Button variant="secondary" size="sm" onClick={() => downloadImage(p.url, `pattern-${p.id}.png`)}>
                  <Download className="w-4 h-4 mr-2" /> {t("common.download")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}

export default function PatternsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PatternsPageContent />
    </Suspense>
  )
}
