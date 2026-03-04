/**
 * Helper to download files using a proxy to avoid CORS issues
 */
export async function downloadFile(url: string, filename: string) {
    try {
        const downloadUrl = `/api/utils/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download helper failed:", e);
        // Fallback: search for direct link if possible
        window.open(url, '_blank');
    }
}
