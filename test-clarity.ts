import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

fal.config({ credentials: process.env.FAL_KEY });

async function main() {
    try {
        const result = await fal.subscribe("clarityai/crystal-upscaler", {
            input: {
                image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                scale: 1,
                creativity: 5.0
            } as any
        });
        console.dir(result, { depth: null });
    } catch (e: any) {
        if (e.body) console.log(e.body);
        else console.log(e);
    }
}
main();
