import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { SummarizeError, summarizePdf, type SummarizeFailure } from "@/lib/gemini"
import { MAX_PDF_BYTES } from "@/lib/summary"
import { formatBytes } from "@/lib/utils"

const TOO_LARGE = `That file is too large. PDFs can be up to ${formatBytes(MAX_PDF_BYTES, 0)}.`

// The user sees one of these; the provider's raw reason goes to the server log.
const FAILURES: Record<SummarizeFailure, { status: number; message: string }> = {
  not_configured: {
    status: 503,
    message: "The summarizer isn't set up yet. Please try again later.",
  },
  rate_limited: {
    status: 429,
    message: "The summarizer is busy right now. Please try again in a minute.",
  },
  quota_exhausted: {
    status: 429,
    message: "Today's summary limit has been reached. Please try again tomorrow.",
  },
  unreadable: {
    status: 422,
    message: "We couldn't read that PDF. It may be damaged, password-protected or empty.",
  },
  blocked: {
    status: 422,
    message: "This document couldn't be summarized.",
  },
  timeout: {
    status: 504,
    message: "That took too long. Try again, or use a shorter PDF.",
  },
  failed: {
    status: 502,
    message: "Something went wrong while summarizing. Please try again.",
  },
}

const fail = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status })

/**
 * Takes a PDF as the raw request body and returns a StudySummary.
 * Signed-in users only — every call spends Gemini quota.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return fail(401, "Your session has expired. Please sign in again.")

  if (!request.headers.get("content-type")?.startsWith("application/pdf")) {
    return fail(415, "Please upload a PDF file.")
  }
  if (Number(request.headers.get("content-length")) > MAX_PDF_BYTES) {
    return fail(413, TOO_LARGE)
  }

  const pdf = await request.arrayBuffer()
  if (pdf.byteLength > MAX_PDF_BYTES) return fail(413, TOO_LARGE)
  if (!looksLikePdf(pdf)) return fail(415, "That file doesn't look like a PDF.")

  try {
    const summary = await summarizePdf(pdf)
    return NextResponse.json({ summary })
  } catch (e) {
    const reason = e instanceof SummarizeError ? e.reason : "failed"
    const detail = e instanceof Error ? e.message : String(e)
    console.error(`[api/summarize] ${reason}: ${detail}`)
    return fail(FAILURES[reason].status, FAILURES[reason].message)
  }
}

/** PDF readers accept the `%PDF-` marker anywhere in the first 1024 bytes. */
function looksLikePdf(file: ArrayBuffer): boolean {
  const marker = [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
  const head = new Uint8Array(file.slice(0, 1024))
  for (let i = 0; i + marker.length <= head.length; i++) {
    if (marker.every((byte, j) => head[i + j] === byte)) return true
  }
  return false
}
