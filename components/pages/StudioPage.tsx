"use client"

import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

import { useState, useEffect, Suspense } from "react"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Upload,
  FileText,
  Ruler,
  Palette,
  Loader2,
  Download,
  Printer,
  FolderPlus,
  Folder,
  History,
  X,
  ChevronRight
} from "lucide-react"
import {
  TbAdjustments,
  TbFileText,
  TbRuler2,
  TbPalette,
  TbPhoto,
  TbDownload,
  TbPrinter,
  TbFolder,
  TbSparkles,
  TbLoader2,
  TbChevronRight,
  TbHistory,
  TbChartBar,
  TbSettings,
  TbHelp,
  TbClipboardText
} from "react-icons/tb"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/context/projects-context"
import { toast } from "sonner"




function StudioPageContent() {
  const searchParams = useSearchParams();
  const { collections, addToCollection, projects, addProject, updateProject } = useProjects();
  const { t, language } = useLanguage();

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const img = searchParams.get("image");
    if (img) {
      setPreview(img);
      analyzeImage(img);
    }
  }, [searchParams]);

  // ... (existing effects)


  const currentProject = projects.find(p => p.imageUrl === preview);
  useEffect(() => {
    if (currentProject?.description && !notes) {
      setNotes(currentProject.description);
    }
  }, [currentProject]);

  const handleNotesBlur = () => {
    if (currentProject) {
      updateProject(currentProject.id, { description: notes });
      toast.success("Notes saved to project");
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      await analyzeImage(selectedFile);
    }
  };

  const analyzeImage = async (source: File | string) => {
    setIsAnalyzing(true);
    try {
      let imageData = "";

      // Helper to resize image
      const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = base64Str;
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxWidth) {
              if (width > height) {
                height *= maxWidth / width;
                width = maxWidth;
              } else {
                width *= maxWidth / height;
                height = maxWidth;
              }
            } else {
              resolve(base64Str);
              return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Convert to jpeg with 0.8 quality to assume safe size
          };
          img.onerror = () => resolve(base64Str); // Fallback to original
        });
      };

      if (source instanceof File) {
        const reader = new FileReader();
        const rawBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(source);
        });
        imageData = await resizeImage(rawBase64);

      } else if (typeof source === "string") {
        if (source.startsWith("data:")) {
          imageData = await resizeImage(source);
        } else {
          // Fetch URL and convert to base64
          try {
            const response = await fetch(source);
            const blob = await response.blob();
            const reader = new FileReader();
            const rawBase64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            imageData = await resizeImage(rawBase64);
          } catch (e) {
            console.error("Failed to fetch image from URL", e);
            toast.error(t("common.error") || "Error loading image");
            setIsAnalyzing(false);
            return;
          }
        }
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          language,
          type: 'techPack'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Analysis failed");
      }

      if (result.status === "success") {
        setData(result.data);
        if (result.data.designNotes) {
          setNotes(result.data.designNotes);
        }
        toast.success(t("studio.analysisSuccess") || "Design analyzed successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : (t("studio.analysisFailed") || "Failed to analyze design"));
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleFabricChange = (field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      fabric: {
        ...prev.fabric,
        [field]: value
      }
    }));
  };

  const handleFitChange = (value: string) => {
    setData((prev: any) => ({
      ...prev,
      fit: value
    }));
  };

  const handleMeasurementChange = (index: number, field: 'label' | 'value', value: string) => {
    setData((prev: any) => {
      const newPoints = [...prev.measurements.points];
      newPoints[index] = { ...newPoints[index], [field]: value };
      return {
        ...prev,
        measurements: {
          ...prev.measurements,
          points: newPoints
        }
      };
    });
  };

  const handleAddToCollection = (collectionId: string) => {
    // Find project ID by preview URL
    let project = projects.find(p => p.imageUrl === preview);
    let projectId = project?.id;

    if (!projectId) {
      // Create new project if it doesn't exist (direct upload)
      if (!data || !preview) {
        toast.error(t("studio.analysisFailed") || "Analysis required first.");
        return;
      }

      const newId = addProject({
        title: data.productName || "New Tech Pack",
        imageUrl: preview,
        type: "Tech Pack",
        description: data.category,
        mediaType: "image"
      });
      projectId = newId;
    }

    addToCollection(collectionId, projectId);
    toast.success(t("studio.addedToCollection"));
    setIsCollectionOpen(false);
  }



  if (!mounted) return null;

  if (!mounted) return null;

  return (
    <>
      <div className="flex flex-col h-full bg-[#0D0D0F]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-screen pb-24">
          <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-8">

            {/* Left: Input Panel */}
            <div className="w-full lg:w-[420px] flex flex-col space-y-6 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                  <TbClipboardText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                    TECH PACK
                  </label>
                  <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                    {language === "tr" ? "Teknik şartname ve ürün detayları." : "Technical specification and product details."}
                  </span>
                </div>
              </div>

              {/* Upload Area */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                  <TbPhoto className="w-4 h-4 text-zinc-500" />
                  {language === "tr" ? "ÜRÜN GÖRSELLERİ" : "PRODUCT IMAGE"}
                </Label>
                <div className="border border-dashed rounded-2xl h-56 border-white/10 hover:border-white/20 transition-all relative group overflow-hidden cursor-pointer bg-[#121214]">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  {preview ? (
                    <img src={preview} className="w-full h-full object-contain p-4 transition-all" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 opacity-30" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t("studio.uploadRef") || "Upload Product Image"}</span>
                    </div>
                  )}
                </div>
              </div>

              {data && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-12 bg-[#121214] border-white/10 hover:bg-[#18181B] text-white font-black text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-none">
                        <FolderPlus className="w-4 h-4 mr-2" /> {t("studio.addToCollection")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#121214] border-white/10 text-white">
                      <DialogTitle className="font-black uppercase tracking-[0.18em] text-[12px]">{t("studio.selectCollection")}</DialogTitle>
                      <DialogDescription className="text-zinc-500 text-[11px] font-bold uppercase">{t("studio.addToMoodboard")}</DialogDescription>
                      <div className="grid gap-2 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {collections.map(c => (
                          <Button key={c.id} variant="ghost" className="justify-start text-[11px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => handleAddToCollection(c.id)}>
                            <Folder className="w-4 h-4 mr-2" />
                            {c.title}
                          </Button>
                        ))}
                        {collections.length === 0 && <p className="text-center text-zinc-500 text-[10px] font-black uppercase">No collections created yet.</p>}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={() => window.print()} className="h-12 bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-xl transition-all">
                    <Printer className="w-4 h-4 mr-2" /> {t("studio.print")}
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Results Panel */}
            <div className="flex-1 flex flex-col space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-1.5">
                <TbSparkles className="w-4 h-4 text-zinc-500" />
                {language === 'tr' ? 'TEKNİK ŞARTNAME' : 'TECHNICAL SPECS'}
              </Label>

              <div className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#121214] border border-dashed border-white/20 overflow-hidden group rounded-2xl shadow-none hover:border-white/40 transition-colors">
                {isAnalyzing ? (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                      <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                        <TbClipboardText className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white">{t("studio.analyzing") || "ANALYZING..."}</h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 max-w-[240px] mx-auto transition-all duration-300 min-h-[1.5em] text-balance">
                        {t("studio.extracting") || "EXTRACTING FABRIC POINTS AND MEASUREMENTS."}
                      </p>
                    </div>
                  </div>
                ) : data ? (
                  <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 lg:p-8 animate-in fade-in zoom-in duration-500">
                    <div id="tech-pack-content" className="max-w-4xl mx-auto space-y-12 bg-white text-black p-8 lg:p-12 shadow-2xl rounded-2xl border border-gray-100">
                      {/* Title Block */}
                      <div className="border-b-[3px] border-black pb-6">
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 text-black leading-none">{data.productName}</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("studio.techSpecSheet")} • {new Date().getFullYear()} COLLECTION</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left: Specs */}
                        <div className="space-y-12">
                          <section>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-7 h-7 rounded bg-black flex items-center justify-center text-white">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black pt-0.5">{language === 'tr' ? 'KUMAŞ & YAPI' : 'FABRIC & DETAILS'}</h3>
                            </div>
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                              <Table>
                                <TableBody>
                                  <TableRow className="border-gray-100">
                                    <TableCell className="font-black text-[9px] uppercase tracking-widest text-gray-400 border-r border-gray-100 py-3">{language === 'tr' ? 'KUMAŞ' : 'FABRIC'}</TableCell>
                                    <TableCell className="p-0">
                                      <input
                                        value={data.fabric.main}
                                        onChange={(e) => handleFabricChange('main', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent font-bold text-xs focus:outline-none"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow className="border-gray-100">
                                    <TableCell className="font-black text-[9px] uppercase tracking-widest text-gray-400 border-r border-gray-100 py-3">{language === 'tr' ? 'İÇERİK' : 'COMP'}</TableCell>
                                    <TableCell className="p-0">
                                      <input
                                        value={data.fabric.composition}
                                        onChange={(e) => handleFabricChange('composition', e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent font-bold text-xs focus:outline-none"
                                      />
                                    </TableCell>
                                  </TableRow>
                                  <TableRow className="border-gray-100">
                                    <TableCell className="font-black text-[9px] uppercase tracking-widest text-gray-400 border-r border-gray-100 py-3">{language === 'tr' ? 'KALIP' : 'FIT'}</TableCell>
                                    <TableCell className="p-0">
                                      <input
                                        value={data?.fit || ""}
                                        onChange={(e) => handleFitChange(e.target.value)}
                                        className="w-full h-10 px-3 bg-transparent font-bold text-xs focus:outline-none"
                                      />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </section>

                          {/* Measurements */}
                          <section>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-7 h-7 rounded bg-black flex items-center justify-center text-white">
                                <Ruler className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black pt-0.5">{language === 'tr' ? 'ÖLÇÜ TABLOSU' : 'MEASUREMENTS'}</h3>
                            </div>
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                              <Table>
                                <TableHeader className="bg-gray-50/50">
                                  <TableRow className="border-gray-100">
                                    <TableHead className="font-black text-[8px] uppercase tracking-widest text-gray-400 h-8">POINT OF MEASURE</TableHead>
                                    <TableHead className="text-right font-black text-[8px] uppercase tracking-widest text-gray-400 h-8">CM</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {data?.measurements?.points?.map((m: any, i: number) => (
                                    <TableRow key={i} className="border-gray-100">
                                      <TableCell className="p-0">
                                        <input
                                          value={m.label}
                                          onChange={(e) => handleMeasurementChange(i, 'label', e.target.value)}
                                          className="w-full h-9 px-3 bg-transparent font-bold text-[11px] focus:outline-none"
                                        />
                                      </TableCell>
                                      <TableCell className="p-0 text-right">
                                        <input
                                          value={m.value}
                                          onChange={(e) => handleMeasurementChange(i, 'value', e.target.value)}
                                          className="w-16 h-9 px-3 bg-transparent font-mono font-black text-[11px] focus:outline-none text-right"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </section>
                        </div>

                        {/* Right: Visuals & Notes */}
                        <div className="space-y-12">
                          <section>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-7 h-7 rounded bg-black flex items-center justify-center text-white">
                                <Palette className="w-3.5 h-3.5" />
                              </div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black pt-0.5">{language === 'tr' ? 'RENKLER' : 'COLORS'}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {data?.colors?.map((c: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                                  <div className="w-10 h-10 rounded-full border border-gray-100 shadow-sm shrink-0" style={{ backgroundColor: c.hex }} />
                                  <div className="min-w-0">
                                    <div className="font-bold text-[10px] text-black truncate uppercase leading-none">{c.name}</div>
                                    <div className="text-[9px] text-gray-400 font-mono mt-1 font-bold">{c.pantone}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section>
                            <div className="px-6 py-4 border-l-2 border-black italic text-xs text-gray-500 leading-relaxed">
                              {data?.constructionDetails?.map((note: string, i: number) => (
                                <p key={i} className="mb-2">● {note}</p>
                              ))}
                            </div>
                          </section>

                          <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black mb-3">{t("studio.designerNotes")}</h3>
                            <Textarea
                              placeholder={t("studio.notesPlaceholder")}
                              className="min-h-[100px] text-xs bg-gray-50 border-gray-100 text-black rounded-xl p-4 shadow-none focus:border-black transition-all"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              onBlur={handleNotesBlur}
                            />
                          </section>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center p-12">
                    <div className="w-20 h-20 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center">
                      <TbFileText className="w-10 h-10 text-white/50" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{language === "tr" ? "VERİ YOK" : "NO DATA"}</h4>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.18em] max-w-[280px] mx-auto text-balance mt-2">
                        {t("studio.uploadToAnalyze") || "Upload a garment image to generate Technical Specs."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* Printable Tech Pack - Visible only during export/print */}
      {
        (isExporting || true) && data && (
          <div id="printable-tech-pack" className={cn("mx-auto bg-white text-black p-[10mm]", isExporting ? "fixed top-0 left-0 w-screen h-screen z-[9999] overflow-auto" : "hidden print:block")}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-black pb-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-wider">{data.productName}</h1>
                <div className="text-sm mt-1 flex gap-4 text-gray-600">
                  <span>{data.sku}</span>
                  <span>•</span>
                  <span>{new Date().getFullYear()} Collection</span>
                  <span>•</span>
                  <span>{data.category}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg tracking-wider">TECH PACK</div>
                <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column: Image */}
              <div className="aspect-[3/4] relative border border-gray-200 bg-gray-50 rounded-lg overflow-hidden">
                {preview ? (
                  <img src={preview} className="w-full h-full object-contain mix-blend-multiply" alt="Product" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
              </div>

              {/* Right Column: Key Specs */}
              <div className="space-y-6">
                {/* Fabric Table */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'KUMAŞ DETAYLARI' : 'FABRICATION'}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 text-gray-500 w-24">Main Fabric</td><td className="font-medium">{data.fabric.main}</td></tr>
                      <tr><td className="py-1 text-gray-500">Composition</td><td className="font-medium">{data.fabric.composition}</td></tr>
                      <tr><td className="py-1 text-gray-500">Weight</td><td className="font-medium">{data.fabric.weight}</td></tr>
                      <tr><td className="py-1 text-gray-500">Finish</td><td className="font-medium">{data.fabric.finish}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Colors */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'RENKLER' : 'COLORWAY'}</h3>
                  <div className="space-y-2">
                    {data?.colors ? (
                      data.colors.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: c.hex, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as any} />
                          <div>
                            <div className="font-bold text-sm">{c.name}</div>
                            <div className="text-xs text-gray-500">{c.pantone}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No colors identified</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'NOTLAR' : 'NOTES'}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {data?.constructionDetails ? (
                      data.constructionDetails.slice(0, 4).map((note: string, i: number) => (
                        <li key={i}>{note}</li>
                      ))
                    ) : (
                      <li className="italic text-gray-400">No notes available</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Measurements Table (Full Width) */}
            <div className="mb-8">
              <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">{language === 'tr' ? 'ÖLÇÜ TABLOSU' : 'MEASUREMENTS'}</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="py-2 px-3 border border-gray-200">Point of Measure</th>
                    <th className="py-2 px-3 border border-gray-200 w-32 text-right">{language === 'tr' ? 'Değer (cm)' : 'Value (cm)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.measurements?.points ? (
                    data.measurements.points.map((m: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 px-3 border border-gray-200">{m.label}</td>
                        <td className="py-2 px-3 border border-gray-200 text-right font-mono">{m.value}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-400 italic border border-gray-200">
                        No measurements available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Designer Notes */}
            {notes && (
              <div className="mb-8">
                <h3 className="font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-2">Designer Comments</h3>
                <p className="text-sm p-3 bg-gray-50 rounded border border-gray-200 italic">{notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-black flex justify-between text-xs text-gray-400">
              <div>{language === 'tr' ? 'Teknik Şartname Belgesi' : 'Technical Specification Sheet'}</div>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        )
      }
    </>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <StudioPageContent />
    </Suspense>
  )
}
