"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Merhaba! Ben ModeOn.ai asistanıyım. Hayalet Manken, Teknik Föy oluşturma veya site kullanımı hakkında bana her şeyi sorabilirsiniz.' }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] })
            })

            if (!response.ok) throw new Error("Failed to fetch")

            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-[99999] print:hidden flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[450px] max-h-[calc(100vh-120px)] mb-2 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg flex justify-between items-center bg-zinc-900">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-full">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white">ModeOn AI</h3>
                                <div className="text-[10px] opacity-80 flex items-center gap-1 text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 min-h-0 p-4 bg-gray-50 dark:bg-zinc-900/50">
                        <div className="space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={cn("flex gap-3", m.role === 'user' ? "justify-end" : "justify-start")}>
                                    {m.role === 'assistant' && (
                                        <Avatar className="w-8 h-8 border bg-white">
                                            <AvatarFallback><Bot className="w-5 h-5 text-black" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words",
                                        m.role === 'user'
                                            ? "bg-black text-white rounded-br-none"
                                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <Avatar className="w-8 h-8 border bg-white">
                                        <AvatarFallback><Bot className="w-5 h-5 text-black" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t bg-white">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Bir şeyler sorun..."
                                className="flex-1 focus-visible:ring-1 border-gray-200"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-black hover:bg-gray-800">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-xl hover:scale-105 transition-transform bg-black hover:bg-gray-900 border-2 border-white/20"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle className="w-7 h-7 text-white" />
                </Button>
            )}
        </div>
    )
}
