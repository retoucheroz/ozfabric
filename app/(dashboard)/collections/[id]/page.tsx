"use client"

import { useProjects } from "@/context/projects-context"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MoreVertical, Plus, Trash2, Edit2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function CollectionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { collections, projects, deleteCollection, updateCollection, removeFromCollection } = useProjects();
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newName, setNewName] = useState("");

    // Safety check just in case, though params are string usually
    const collectionId = Array.isArray(id) ? id[0] : id;

    const collection = collections.find(c => c.id === collectionId);

    // Filter projects that are IN this collection
    const collectionProjects = projects.filter(p => collection?.projectIds.includes(p.id));

    useEffect(() => {
        if (collection) setNewName(collection.title);
    }, [collection]);

    if (!collection) {
        return <div className="p-8">Collection not found</div>
    }

    const handleDeleteCollection = () => {
        if (confirm("Are you sure you want to delete this collection? Projects will not be deleted.")) {
            deleteCollection(collection.id);
            toast.success("Collection deleted");
            router.push('/collections');
        }
    }

    const handleRename = () => {
        if (!newName.trim()) return;
        updateCollection(collection.id, { title: newName });
        setIsRenameOpen(false);
        toast.success("Collection renamed");
    }

    const handleRemoveProject = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation(); // Prevent navigation
        removeFromCollection(collection.id, projectId);
        toast.success("Item removed from collection");
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{collection.title}</h1>
                    <p className="text-muted-foreground mt-1">{collection.description || `${collectionProjects.length} items`}</p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleDeleteCollection}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {collectionProjects.map(project => (
                    <Card key={project.id} className="group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all relative" onClick={() => router.push(`/studio?image=${encodeURIComponent(project.imageUrl)}`)}>
                        <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-t-xl">
                            <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                {project.type}
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => handleRemoveProject(e, project.id)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 bg-card rounded-b-xl border border-t-0">
                            <h3 className="font-medium truncate">{project.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 text-ellipsis overflow-hidden whitespace-nowrap">{project.description || "No notes"}</p>
                        </div>
                    </Card>
                ))}

                {/* Add Item Placeholder */}
                <div className="border-2 border-dashed rounded-xl flex items-center justify-center aspect-[3/4] cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/home')}>
                    <div className="text-center text-muted-foreground">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span>Add New Designs</span>
                    </div>
                </div>
            </div>

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Collection</DialogTitle>
                        <DialogDescription>Enter a new name for your collection.</DialogDescription>
                    </DialogHeader>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Summer 2026" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
