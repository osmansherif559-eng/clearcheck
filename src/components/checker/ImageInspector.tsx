"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { analyze } from "@/lib/analysis/analyze";
import type { AnalysisMode, AnalysisResult } from "@/lib/analysis/types";
import Icon from "@/components/ui/Icon";
import { clampImageDimensions, classifyQrPayload, imageFileLabel, validateImageFile } from "@/lib/image-inspection";

type InspectorStatus = "idle" | "reading" | "decoding" | "ready" | "error";

export default function ImageInspector({ onAnalyze }: { onAnalyze: (input: string, mode: AnalysisMode) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState<InspectorStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Choose a screenshot or photo. It stays in this browser.");
  const [error, setError] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef("");

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function chooseFile(nextFile: File | null) {
    const validationError = validateImageFile(nextFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreviewUrl("");
      setReviewText("");
      setQrPayload("");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextUrl = URL.createObjectURL(nextFile as File);
    previewUrlRef.current = nextUrl;
    setFile(nextFile);
    setPreviewUrl(nextUrl);
    setStatus("idle");
    setProgress(0);
    setError("");
    setReviewText("");
    setQrPayload("");
    setStatusMessage("Ready. Read the screenshot, find a QR code, or do both.");
  }

  async function imageData() {
    if (!file) throw new Error("Choose an image first.");
    const image = new Image();
    image.src = URL.createObjectURL(file);
    try {
      await image.decode();
      const dimensions = clampImageDimensions(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("This browser could not prepare the image for local inspection.");
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
      return { canvas, context, width: dimensions.width, height: dimensions.height };
    } finally {
      URL.revokeObjectURL(image.src);
    }
  }

  async function readText() {
    if (!file) return;
    setStatus("reading");
    setProgress(0.04);
    setError("");
    setStatusMessage("Loading the local English OCR model. The first read can take a moment on a phone.");
    let worker: { terminate: () => Promise<unknown> } | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      const createdWorker = await createWorker("eng", 1, {
        workerPath: "/ocr/tesseract/worker.min.js",
        corePath: "/ocr/tesseract/core",
        langPath: "/ocr/tesseract/lang/4.0.0_best_int",
        gzip: true,
        workerBlobURL: false,
        cachePath: "clearcheck/ocr-eng-4.0.0-best-int",
        logger: (message: { progress?: number; status?: string }) => {
          setProgress(Math.max(0.05, Math.min(.98, message.progress ?? 0.1)));
          if (message.status) setStatusMessage(`Reading locally: ${message.status}`);
        },
      });
      worker = createdWorker;
      const result = await createdWorker.recognize(file);
      const text = result.data.text.trim();
      if (!text) throw new Error("No readable text was found. Try a sharper, brighter screenshot or review the QR option.");
      setReviewText(text);
      setProgress(1);
      setStatus("ready");
      setStatusMessage("Review the extracted text carefully. OCR can make mistakes in names, numbers, and links.");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "The image could not be read locally.");
      setStatusMessage("No text was produced.");
    } finally {
      await worker?.terminate();
    }
  }

  async function findQr() {
    if (!file) return;
    setStatus("decoding");
    setProgress(.15);
    setError("");
    setStatusMessage("Looking for a QR code locally. ClearCheck will not open its destination.");
    try {
      const { canvas, context, width, height } = await imageData();
      const { default: decodeQr } = await import("jsqr");
      const pixels = context.getImageData(0, 0, width, height);
      const result = decodeQr(pixels.data, width, height, { inversionAttempts: "attemptBoth" });
      if (!result?.data) {
        setQrPayload("");
        setStatus("ready");
        setProgress(1);
        setStatusMessage("No QR code was detected. Try a sharper image with the code fully visible.");
        return;
      }
      setQrPayload(classifyQrPayload(result.data)?.value ?? "");
      setProgress(1);
      setStatus("ready");
      setStatusMessage("QR payload found. Review it before inspecting; ClearCheck will not open it.");
      void canvas;
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "The QR code could not be read locally.");
      setStatusMessage("QR inspection failed.");
    }
  }

  function analyzeText() {
    const text = reviewText.trim();
    if (text) onAnalyze(text, "message");
  }

  function inspectQr() {
    const payload = qrPayload.trim();
    if (!payload) return;
    onAnalyze(payload, classifyQrPayload(payload)?.kind === "url" ? "url" : "message");
  }

  return (
    <section className="image-inspector" aria-labelledby="image-inspector-title">
      <div className="image-inspector-heading"><div><span className="section-kicker">Local image lab</span><h2 id="image-inspector-title">Read a screenshot without uploading it.</h2><p>OCR and QR decoding run in this browser. Review anything extracted before ClearCheck analyzes it.</p></div><span className="local-badge"><Icon name="lock" size={13} /> On this device</span></div>
       <input ref={inputRef} className="sr-only" type="file" aria-label="Choose a screenshot or photo" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
      {!file ? <button className="image-dropzone" type="button" onClick={() => inputRef.current?.click()}><span className="image-upload-icon"><Icon name="eye" size={24} /></span><strong>Choose a screenshot or photo</strong><small>PNG, JPEG, or WebP · up to 8 MB · camera supported where available</small></button> : <div className="image-workspace">
        <div className="image-preview-panel"><img src={previewUrl} alt="Local preview of the selected suspicious message image" /><div className="image-file-label"><Icon name="clipboard" size={14} /> {imageFileLabel(file)}</div><button className="quiet-button" type="button" onClick={() => inputRef.current?.click()}><Icon name="refresh" size={14} /> Choose another</button></div>
        <div className="image-actions-panel"><div className="image-action-buttons"><button className="secondary-button" type="button" onClick={readText} disabled={status === "reading"}><Icon name="message" size={16} /> {status === "reading" ? "Reading…" : "Read screenshot"}</button><button className="secondary-button" type="button" onClick={findQr} disabled={status === "decoding"}><Icon name="link" size={16} /> {status === "decoding" ? "Looking…" : "Find QR code"}</button></div><div className="image-status" role="status" aria-live="polite"><span className={status === "error" ? "status-dot error" : "status-dot"} />{statusMessage}</div>{(status === "reading" || status === "decoding") && <progress value={progress} max="1" aria-label="Image analysis progress" />}{error && <div className="form-error" role="alert"><Icon name="alert" size={16} />{error}</div>}
          {reviewText && <div className="image-review"><label htmlFor="ocr-review"><span><strong>Review extracted text</strong><small>Correct OCR mistakes and remove passwords, codes, or financial details.</small></span></label><textarea id="ocr-review" value={reviewText} onChange={(event) => setReviewText(event.target.value)} /><button className="primary-button" type="button" onClick={analyzeText}>Analyze reviewed text <Icon name="arrow-up-right" size={16} /></button></div>}
          {qrPayload && <div className="image-review qr-review"><label htmlFor="qr-review"><span><strong>Review QR payload</strong><small>{classifyQrPayload(qrPayload)?.kind === "url" ? "This looks like a URL. Inspect it without opening the destination." : "This is text. Review it before analysis."}</small></span></label><textarea id="qr-review" value={qrPayload} onChange={(event) => setQrPayload(event.target.value)} /><button className="primary-button" type="button" onClick={inspectQr}>{classifyQrPayload(qrPayload)?.kind === "url" ? "Inspect QR URL" : "Analyze QR text"} <Icon name="arrow-up-right" size={16} /></button></div>}
        </div>
      </div>}
      <p className="image-privacy"><Icon name="shield-check" size={14} /> Images and extracted text are held only in this page and are released when you choose another file or leave the page. OCR assets are served locally by ClearCheck.</p>
    </section>
  );
}
