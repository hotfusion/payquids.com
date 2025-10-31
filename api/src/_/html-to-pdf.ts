import puppeteer, { Browser, PDFOptions } from "puppeteer";

export class PDFConverter {
    private browser: Browser | null = null;

    private async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }
        return this.browser;
    }

    public async convert(html: string, options: PDFOptions = {}): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfUint8 = await page.pdf({
            format: "A4",
            printBackground: true,
            ...options,
        });

        await page.close();
        return Buffer.from(pdfUint8); // ✅ Convert Uint8Array → Buffer
    }

    public async convertFile(filePath: string, options: PDFOptions = {}): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        await page.goto(`file://${filePath}`, { waitUntil: "networkidle0" });

        const pdfUint8 = await page.pdf({
            format: "A4",
            printBackground: true,
            ...options,
        });

        await page.close();
        return Buffer.from(pdfUint8); // ✅
    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
