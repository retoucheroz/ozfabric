import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const projects = await prisma.project.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // Map them back to the frontend properties if needed,
        // or just return as is. The frontend expects camelCase with timestamp.
        const formatted = projects.map((p: any) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            imageUrl: p.imageUrl,
            originalImage: p.originalImage,
            description: p.prompt || "",
            isFavorite: p.isFavorite,
            createdAt: new Date(p.createdAt).getTime(), // convert string/date to ms timestamp
            settings: p.settings,
        }));

        return NextResponse.json({ projects: formatted });
    } catch (error: any) {
        console.error("Projects GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        const project = await prisma.project.create({
            data: {
                userId: session.user.id,
                title: body.title || "Untitled Project",
                type: body.type || "Style",
                imageUrl: body.imageUrl,
                originalImage: body.originalImage || null,
                prompt: body.description || null,
                isFavorite: body.isFavorite || false,
                settings: body.settings || {},
                // If the frontend generated an ID, you could theoretically force it:
                // id: body.id, 
            }
        });

        return NextResponse.json({
            success: true, project: {
                ...project,
                createdAt: new Date(project.createdAt).getTime()
            }
        });
    } catch (error: any) {
        console.error("Projects POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
