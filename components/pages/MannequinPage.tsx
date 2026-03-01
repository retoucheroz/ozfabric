"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, History, Heart, Save, UserCircle } from "lucide-react"
import {
  TbUserCircle,
  TbHistory,
  TbHeart,
  TbSearch,
  TbFilter,
  TbArrowRight,
  TbSettings,
  TbHelp,
  TbChevronRight,
  TbChevronLeft,
  TbUpload,
  TbBolt
} from "react-icons/tb"

// Mock Data for Mannequins
const MANNEQUINS = [
  { id: 1, name: "Studio Basic 1", gender: "Female", ethnicity: "African", age: "Young Adult", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400" },
  { id: 2, name: "Studio Basic 2", gender: "Female", ethnicity: "Caucasian", age: "Adult", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400" },
  { id: 3, name: "Casual Male", gender: "Male", ethnicity: "Asian", age: "Young Adult", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400" },
  { id: 4, name: "Streetwear 1", gender: "Female", ethnicity: "Latina", age: "Young Adult", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" },
  { id: 5, name: "Classic 1", gender: "Male", ethnicity: "Caucasian", age: "Adult", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" },
  { id: 6, name: "Runway 1", gender: "Female", ethnicity: "Asian", age: "Young Adult", image: "https://images.unsplash.com/photo-1529139574466-a302d27460bf?auto=format&fit=crop&q=80&w=400" },
  { id: 7, name: "Editorial 1", gender: "Female", ethnicity: "African", age: "Adult", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400" },
  { id: 8, name: "Catalog 1", gender: "Male", ethnicity: "African", age: "Young Adult", image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=400" },
]

import { useRouter } from "next/navigation"

export default function MannequinPage() {
  const router = useRouter();
  const [selectedMannequin, setSelectedMannequin] = useState<number | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Main Selection Area */}
      <div className="flex-1 flex flex-col border-r">

        {/* Header & Controls */}
        <div className="p-8 border-b border-white/5 bg-[#0D0D0F] space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
                <TbUserCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">Select Model</h2>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-0.5">Professional AI Models for Production</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-10 gap-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <TbHistory className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">History</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-10 gap-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <TbHeart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Favorites</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="bg-white/5 border border-white/5 p-1 h-11 rounded-xl max-w-[400px]">
              <TabsTrigger value="templates" className="text-[10px] font-black uppercase tracking-[0.2em] rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all">Templates</TabsTrigger>
              <TabsTrigger value="prompt" className="text-[10px] font-black uppercase tracking-[0.2em] rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all">Prompt</TabsTrigger>
              <TabsTrigger value="assets" className="text-[10px] font-black uppercase tracking-[0.2em] rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all">Assets</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-4">
            <Select>
              <SelectTrigger><SelectValue placeholder="Age" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="young-adult">Young Adult</SelectItem>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger><SelectValue placeholder="Ethnicity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asian">Asian</SelectItem>
                <SelectItem value="african">African</SelectItem>
                <SelectItem value="caucasian">Caucasian</SelectItem>
                <SelectItem value="latino">Latino</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 dark:bg-stone-950/20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MANNEQUINS.map((m) => (
              <Card
                key={m.id}
                className={`group cursor-pointer overflow-hidden border-2 transition-all hover:scale-[1.02] ${selectedMannequin === m.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-transparent'}`}
                onClick={() => setSelectedMannequin(m.id)}
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white text-black hover:bg-zinc-200 shadow-xl"><Heart className="w-4 h-4" /></Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 pt-10 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <p className="text-white text-xs font-black uppercase tracking-widest">{m.name}</p>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-tight mt-1">{m.gender} • {m.ethnicity}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Preview/Action Panel */}
      {selectedMannequin ? (
        <div className="w-[300px] border-l bg-background p-6 flex flex-col animate-in slide-in-from-right duration-300">
          <h3 className="font-semibold mb-4">Selected Mannequin</h3>
          <div className="rounded-lg overflow-hidden border shadow-sm mb-6">
            <img
              src={MANNEQUINS.find(m => m.id === selectedMannequin)?.image}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{MANNEQUINS.find(m => m.id === selectedMannequin)?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-medium">EU 36 / US 4</span>
            </div>
          </div>


        </div>
      ) : (
        <div className="w-[300px] border-l bg-muted/10 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
          <div className="p-4 bg-muted/20 rounded-full mb-4">
            <Filter className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-sm">Select a model from the grid to view details</p>
        </div>
      )}
    </div>
  )
}
