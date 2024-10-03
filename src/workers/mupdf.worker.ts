/// <reference lib="webworker" />
import * as Comlink from 'comlink'
import { PDFDocument } from 'mupdf'
export const MUPDF_LOADED = 'MUPDF_LOADED'

export class MupdfWorker {
    private mupdf?: any

    constructor() {
        this.initializeMupdf()
    }

    private async initializeMupdf() {
        try {
            const mupdfModule = await import("mupdf")
            this.mupdf = mupdfModule
            postMessage({ "info": MUPDF_LOADED })
        } catch (error) {
            console.error('Failed to initialize MuPDF:', error)
        }
    }

    async processPdf(pdf: ArrayBuffer): Promise<string> {
        if (!this.mupdf) { return Promise.reject(); }
        const doc = this.mupdf.Document.openDocument(pdf, "application/pdf") as PDFDocument;
        const pageCount = doc.countPages();
        postMessage({ "count": pageCount });
        for (let i = 0; i < pageCount; i++) {
            const page = doc.loadPage(i);
            const img = page.toPixmap(this.mupdf.Matrix.scale(2, 2), this.mupdf.ColorSpace.DeviceRGB);
            const page_obj = page.getObject()
            const image = doc.addImage(new this.mupdf.Image(img));

            let res = page_obj.get("Resources")
            if (!res.isDictionary()) {
                page_obj.put("Resources", res = doc.newDictionary())
            }
            let res_xobj = res.get("XObject")
            if (!res_xobj.isDictionary()) {
                res.put("XObject", res_xobj = doc.newDictionary())
            }
            res_xobj.put("ImageContent", image)
            const extra_contents = doc.addStream(`q ${page.getBounds()[2] - page.getBounds()[0]} 0 0 ${page.getBounds()[3] - page.getBounds()[1]} ${page.getBounds()[0]} ${page.getBounds()[1]} cm /ImageContent Do Q`, null)
            const page_contents = page_obj.get("Contents")
            if (page_contents.isArray()) {
                page_contents.push(extra_contents)
            } else {
                const new_page_contents = doc.newArray()
                new_page_contents.push(page_contents)
                new_page_contents.push(extra_contents)
                page_obj.put("Contents", new_page_contents)
            }
            postMessage({ "progress": i })
        }
        const buffer = doc.saveToBuffer("compress").asUint8Array();
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        postMessage({ "progress": pageCount });
        return url;
    }
}

Comlink.expose(new MupdfWorker())
