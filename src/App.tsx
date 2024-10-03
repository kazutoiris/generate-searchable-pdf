import { useState, useEffect } from 'react'
import './App.css'
import type { MupdfWorker } from './workers/mupdf.worker.ts'
import * as Comlink from 'comlink'

// Initialize the worker and wrap it with Comlink
const worker = new Worker(new URL('./workers/mupdf.worker.ts', import.meta.url), { type: 'module' })
const mupdfWorker = Comlink.wrap<MupdfWorker>(worker)

function App() {
  const [count, setCount] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [workerInitialized, setWorkerInitialized] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for the worker initialization message
    const handleWorkerMessage = (event: MessageEvent) => {
      if (event.data.info === 'MUPDF_LOADED') {
        setWorkerInitialized(true)
      } else if (event.data.progress) {
        setProgress(event.data.progress);
      } else if (event.data.count) {
        setCount(event.data.count);
      }
    }

    worker.addEventListener('message', handleWorkerMessage)

    return () => {
      worker.removeEventListener('message', handleWorkerMessage)
    }
  }, [])

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target || !event.target.files) {
      return;
    }
    const file = event.target.files[0];
    if (file) {
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target) {
          return;
        }
        const arrayBuffer = e.target.result;
        processPdf(arrayBuffer as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.target || !event.dataTransfer.files) {
      return;
    }
    const file = event.dataTransfer.files[0]
    if (file) {
      setPdfFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target) {
          return;
        }
        const arrayBuffer = e.target.result;
        processPdf(arrayBuffer as ArrayBuffer);
      };
      reader.readAsArrayBuffer(file);
    }
    event.preventDefault();
  }


  const processPdf = async (arrayBuffer: ArrayBuffer) => {
    setCount(0);
    setProgress(0);
    setPdfUrl("");
    mupdfWorker.processPdf(arrayBuffer).then((url) => {
      setPdfUrl(url);
    })
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <div className="mt-5 mb-5 p-5 flex flex-col space-y-16 items-center justify-center w-full h-full" onDragOver={(e) => e.preventDefault()} >
        <div className='flex flex-col space-y-5'>
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white text-center">{(!pdfUrl && count != 0) ? `已为您处理 ${progress}/${count} 页` : "在线双面 PDF 制作工具"}</h1>
          <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">所有文件均在本地处理，不需要连接网络。</p>
        </div>
        <div className='flex flex-row space-x-5'>
          <div className='w-96'>
            <label className="flex flex-col items-center justify-center h-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6" onDrop={handleDrop}>
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                {workerInitialized ?
                  <div>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center"><span className="font-semibold">单击上传</span> 或拖动到此处</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{pdfFileName ? `当前文件：${pdfFileName}` : "仅限 PDF 文件"}</p>
                  </div> :
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">正在加载依赖（文件较大，请耐心等待）</p>
                  </div>
                }
              </div>
              <input type="file" accept="application/pdf" disabled={!workerInitialized || count != progress} onChange={handleUpload} className="hidden" />
            </label>
          </div>
          {
            pdfUrl ?
              <button
                className="items-center justify-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                onClick={handleDownload}>下载 PDF</button>
              :
              <button disabled type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
                <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
                </svg>
                {workerInitialized ? (count === 0 ? "等待上传" : "处理中") : "加载依赖"}
              </button>
          }
        </div>
        {pdfUrl && <iframe
          allowFullScreen={true}
          src={pdfUrl}
          className='w-full h-screen'
          title="PDF Preview"
        />}
      </div>
    </>
  )
}

export default App
