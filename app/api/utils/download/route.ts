import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "download";

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();
        const headers = new Headers();

        // Force download with Content-Disposition
        headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Proxy Download Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
