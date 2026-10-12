import type { StudySummary } from "./summary"

/** Turn a summary into files the user can keep. Runs in the browser. */

export function toMarkdown(title: string, summary: StudySummary): string {
  const blocks = [`# ${title}`, summary.overview]

  if (summary.keyPoints.length > 0) {
    blocks.push(["## Key points", ...summary.keyPoints.map((point) => `- ${point}`)].join("\n"))
  }
  if (summary.keyTerms.length > 0) {
    blocks.push(
      ["## Key terms", ...summary.keyTerms.map((t) => `- **${t.term}**: ${t.definition}`)].join("\n")
    )
  }
  if (summary.questions.length > 0) {
    blocks.push(
      [
        "## Revision questions",
        ...summary.questions.map((q, i) => `${i + 1}. ${q.question}\n   - ${q.answer}`),
      ].join("\n")
    )
  }
  if (summary.quiz.length > 0) {
    blocks.push(
      [
        "## Quiz",
        ...summary.quiz.map(
          (q, i) =>
            `${i + 1}. ${q.question}\n${q.options
              .map((option, j) => `   - ${String.fromCharCode(65 + j)}. ${option}`)
              .join("\n")}\n   - Answer: ${String.fromCharCode(65 + q.answerIndex)}. ${q.explanation}`
        ),
      ].join("\n")
    )
  }
  return blocks.filter(Boolean).join("\n\n") + "\n"
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * An HTML document saved with a .doc name. Word opens it as a normal document,
 * which avoids shipping a .docx library to the browser.
 */
export function toWordDocument(title: string, summary: StudySummary): string {
  const e = escapeHtml
  const parts = [`<h1>${e(title)}</h1>`]
  if (summary.overview) parts.push(`<p>${e(summary.overview)}</p>`)

  if (summary.keyPoints.length > 0) {
    parts.push("<h2>Key points</h2>", `<ul>${summary.keyPoints.map((p) => `<li>${e(p)}</li>`).join("")}</ul>`)
  }
  if (summary.keyTerms.length > 0) {
    parts.push(
      "<h2>Key terms</h2>",
      ...summary.keyTerms.map((t) => `<p><b>${e(t.term)}</b>: ${e(t.definition)}</p>`)
    )
  }
  if (summary.questions.length > 0) {
    parts.push(
      "<h2>Revision questions</h2>",
      `<ol>${summary.questions.map((q) => `<li>${e(q.question)}<br><i>${e(q.answer)}</i></li>`).join("")}</ol>`
    )
  }
  if (summary.quiz.length > 0) {
    parts.push(
      "<h2>Quiz</h2>",
      `<ol>${summary.quiz
        .map(
          (q) =>
            `<li>${e(q.question)}<ol type="A">${q.options.map((o) => `<li>${e(o)}</li>`).join("")}</ol>` +
            `<i>Answer: ${String.fromCharCode(65 + q.answerIndex)}. ${e(q.explanation)}</i></li>`
        )
        .join("")}</ol>`
    )
  }

  return (
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">` +
    `<head><meta charset="utf-8"><title>${e(title)}</title>` +
    `<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5}h1{font-size:20pt}h2{font-size:14pt;margin-top:18pt}</style>` +
    `</head><body>${parts.join("")}</body></html>`
  )
}

export function downloadFile(name: string, content: string, type: string) {
  // The BOM makes Word and Notepad read the file as UTF-8.
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** A safe file name from a summary title. */
export function fileNameFor(title: string, extension: string): string {
  const base = title
    .replace(/[^\p{L}\p{M}\p{N} _-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
  return `${base || "summary"}.${extension}`
}
