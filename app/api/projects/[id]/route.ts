import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const existingProject = await prisma.project.findUnique({
            where: { id: id },
        });

        if (!existingProject || existingProject.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
        }

        await prisma.project.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Project DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const body = await req.json();

        const existingProject = await prisma.project.findUnique({
            where: { id: id },
        });

        if (!existingProject || existingProject.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                title: body.title !== undefined ? body.title : undefined,
                isFavorite: body.isFavorite !== undefined ? body.isFavorite : undefined,
                prompt: body.description !== undefined ? body.description : undefined,
                settings: body.settings !== undefined ? body.settings : undefined,
            },
        });

        return NextResponse.json({ success: true, project: updated });
    } catch (error: any) {
        console.error("Project PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
