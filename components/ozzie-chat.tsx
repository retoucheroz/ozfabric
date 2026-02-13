"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Bot, Send, Sparkles, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"

type Message = {
    id: string;
    role: "user" | "bot";
    text: string;
}

export function OzzieChat() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Check localStorage for enabled state
    useEffect(() => {
        const stored = localStorage.getItem("ozzie-chat-enabled");
        setEnabled(stored === "true");
    }, []);

    // Listen for changes from settings page
    useEffect(() => {
        const handleStorage = () => {
            const stored = localStorage.getItem("ozzie-chat-enabled");
            setEnabled(stored === "true");
        };
        window.addEventListener("storage", handleStorage);
        // Also listen for custom event from same tab
        window.addEventListener("ozzie-toggle", handleStorage);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("ozzie-toggle", handleStorage);
        };
    }, []);

    // Set initial message
    useEffect(() => {
        const greeting = language === "tr"
            ? "Merhaba! Ben Oz Fabric AI. Stil tasarımı, desen oluşturma, hayalet manken veya teknik föy konularında size nasıl yardımcı olabilirim?"
            : "Hi! I'm Oz Fabric AI. How can I help you with style design, patterns, ghost mannequin, or tech packs today?";
        setMessages([{ id: "1", role: "bot", text: greeting }]);
    }, [language]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Convert messages to API format
            const apiMessages = messages.concat(userMsg).map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) throw new Error("Failed");

            const data = await response.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                text: data.content
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "bot",
                text: language === "tr" ? "Üzgünüm, şu an yanıt veremiyorum." : "Sorry, I can't respond right now."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render if not enabled
    if (!enabled) return null;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-all z-50 bg-violet-600 hover:bg-violet-700 text-white border-2 border-white/20"
                >
                    <Bot className="w-7 h-7" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 flex flex-col border-l-violet-100 dark:border-zinc-800">
                <SheetHeader className="p-4 border-b bg-violet-600 text-white shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        Oz Fabric AI
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-zinc-900" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? 'flex-row-reverse' : '')}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                                    msg.role === 'user' ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-violet-600 border-violet-100'
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={cn(
                                    "p-3.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words leading-relaxed",
                                    msg.role === 'user'
                                        ? 'bg-zinc-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                )}>
                                    {msg.text.replace(/\*\*/g, '')}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex w-full justify-start">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-white text-violet-600 border-violet-100">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-white dark:bg-background shrink-0">
                    <form
                        className="flex gap-2 relative"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                    >
                        <Input
                            placeholder={language === "tr" ? "Oz Fabric AI'a ilet..." : "Message Oz Fabric AI..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="pr-12 py-6 bg-slate-50 border-slate-200 focus-visible:ring-violet-500"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1.5 top-1.5 h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
