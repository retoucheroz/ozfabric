"use client"

import { useRef, useEffect, useState } from 'react'

export function HeroVideo({ className }: { className?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const requestRef = useRef<number | null>(null)

    useEffect(() => {
        // Cleanup animation frame on unmount
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current)
            }
        }
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !containerRef.current || !isHovering) return

        const { left, width } = containerRef.current.getBoundingClientRect()
        // Calculate relative mouse position (0 to 1)
        let percentage = (e.clientX - left) / width
        percentage = Math.max(0, Math.min(1, percentage))

        // Use requestAnimationFrame for smooth throttling
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current)
        }

        requestRef.current = requestAnimationFrame(() => {
            if (!videoRef.current) return
            const duration = videoRef.current.duration
            if (duration && isFinite(duration)) {
                videoRef.current.currentTime = duration * percentage
            }
        })
    }

    const handleMouseEnter = () => {
        setIsHovering(true)
        if (videoRef.current) {
            videoRef.current.pause()
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current)
        }
        if (videoRef.current) {
            videoRef.current.play().catch(console.error) // resume play and ignore any potential Promise rejection
        }
    }

    return (
        <div
            ref={containerRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                src="/videos/hero-login.mp4"
                className="w-full h-full object-cover object-[center_top] pointer-events-none"
                autoPlay
                muted
                loop
                playsInline
            />
        </div>
    )
}
