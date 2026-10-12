import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import {
  SummarizeError,
  summarize,
  type SummarizeFailure,
  type SummarySource,
} from "@/lib/gemini"
import { getUsage, recordUsage, saveSummary } from "@/lib/summaries"
import {
  DAILY_SUMMARY_LIMIT,
  DETAIL_LEVELS,
  FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
  type DetailLevel,
} from "@/lib/summary"
import { formatBytes } from "@/lib/utils"

const TOO_LARGE = `That file is too large. Files can be up to ${formatBytes(MAX_FILE_BYTES, 0)}.`
const WRONG_TYPE = "Please upload a PDF or an image (PNG, JPG or WebP)."

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
    message: "We couldn't read that document. It may be damaged, password-protected or empty.",
  },
  blocked: {
    status: 422,
    message: "This document couldn't be summarized.",
  },
  timeout: {
    status: 504,
    message: "That took too long. Try again, or use a shorter document.",
  },
  failed: {
    status: 502,
    message: "Something went wrong while summarizing. Please try again.",
  },
}

const fail = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status })

/**
 * Takes a document as the raw request body (a PDF, an image, or plain text),
 * summarizes it and saves the result to the user's history. Signed-in users
 * only — every call spends Gemini quota.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return fail(401, "Your session has expired. Please sign in again.")

  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim()
  const isText = contentType === "text/plain"
  if (!isText && !FILE_TYPES.some((type) => type === contentType)) return fail(415, WRONG_TYPE)

  if (Number(request.headers.get("content-length")) > MAX_FILE_BYTES) {
    return fail(413, TOO_LARGE)
  }

  const usage = await getUsage()
  if (usage.used >= usage.limit) {
    return NextResponse.json(
      { error: `You've used all ${DAILY_SUMMARY_LIMIT} summaries for today.`, usage },
      { status: 429 }
    )
  }

  const body = await request.arrayBuffer()
  if (body.byteLength > MAX_FILE_BYTES) return fail(413, TOO_LARGE)

  let source: SummarySource
  if (isText) {
    const text = new TextDecoder().decode(body).trim()
    if (text.length < MIN_TEXT_CHARS) {
      return fail(422, `Please paste at least ${MIN_TEXT_CHARS} characters of text.`)
    }
    if (text.length > MAX_TEXT_CHARS) {
      return fail(
        413,
        `That text is too long. Paste up to ${MAX_TEXT_CHARS.toLocaleString("en-US")} characters.`
      )
    }
    source = { kind: "text", text }
  } else {
    // Trust the bytes, not the header the browser sent.
    if (detectFileType(body) !== contentType) {
      return fail(415, "That file doesn't match its type. Please upload a PDF or an image.")
    }
    source = { kind: "file", bytes: body, mimeType: contentType }
  }

  try {
    const summary = await summarize(source, detailFrom(request))

    // Only a summary that was actually produced counts against the limit.
    await recordUsage()
    const saved = await saveSummary(fileNameFrom(request, isText), summary)

    return NextResponse.json({
      summary,
      saved,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        // The first summary of the window starts the 24 hours.
        resetsAt: usage.resetsAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  } catch (e) {
    const reason = e instanceof SummarizeError ? e.reason : "failed"
    const detail = e instanceof Error ? e.message : String(e)
    console.error(`[api/summarize] ${reason}: ${detail}`)
    return fail(FAILURES[reason].status, FAILURES[reason].message)
  }
}

function detailFrom(request: NextRequest): DetailLevel {
  const value = request.headers.get("x-detail")
  return DETAIL_LEVELS.find((level) => level === value) ?? "standard"
}

/** The browser sends the name URL-encoded in a header; it is only a label. */
function fileNameFrom(request: NextRequest, isText: boolean): string {
  if (isText) return "Pasted text"

  let name = request.headers.get("x-file-name") ?? ""
  try {
    name = decodeURIComponent(name)
  } catch {
    // Not valid encoding — use it as sent.
  }
  // Drop any path and control characters, and keep it to the column's limit.
  name = (name.split(/[\\/]/).pop() ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255)
  return name || "document"
}

/** Identify a supported file by its leading bytes. */
function detectFileType(file: ArrayBuffer): (typeof FILE_TYPES)[number] | null {
  const head = new Uint8Array(file.slice(0, 1024))
  const startsWith = (bytes: number[], offset = 0) =>
    bytes.every((byte, i) => head[offset + i] === byte)

  if (startsWith([0x89, 0x50, 0x4e, 0x47])) return "image/png"
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg"
  // RIFF....WEBP
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp"
  }
  // PDF readers accept the `%PDF-` marker anywhere in the first 1024 bytes.
  const marker = [0x25, 0x50, 0x44, 0x46, 0x2d]
  for (let i = 0; i + marker.length <= head.length; i++) {
    if (startsWith(marker, i)) return "application/pdf"
  }
  return null
}
