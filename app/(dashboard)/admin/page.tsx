"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminPanel from "@/components/pages/AdminPanel"

export default function Page() {
    const router = useRouter()

    useEffect(() => {
        // Fetch session and guard — non-admins get redirected to /home
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                const role = data?.user?.role
                const email = data?.user?.email?.toLowerCase()
                const name = data?.user?.name?.toLowerCase()
                const isAdmin =
                    role === 'admin' ||
                    email === 'admin' ||
                    name === 'admin' ||
                    email === 'kilicozzgur@gmail.com' ||
                    name === 'retoucheroz' ||
                    email === 'retoucheroz@gmail.com'

                if (!isAdmin) {
                    router.replace('/home')
                }
            })
            .catch(() => router.replace('/home'))
    }, [router])

    return <AdminPanel />
}
