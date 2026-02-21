"use client"

import Button from "@rahoot/web/components/Button"
import { QuizzWithId } from "@rahoot/common/types/game"
import { useState } from "react"
import toast from "react-hot-toast"

type ViewProps = {
  mode: "view"
  quizz: QuizzWithId
  onClose: () => void
  onImport?: never
}

type ImportProps = {
  mode: "import"
  quizz?: never
  onClose: () => void
  onImport: (_json: string) => void
}

type Props = ViewProps | ImportProps

const QuizzJsonModal = ({ mode, quizz, onClose, onImport }: Props) => {
  const jsonContent =
    mode === "view" && quizz
      ? JSON.stringify(
          { subject: quizz.subject, questions: quizz.questions },
          null,
          2,
        )
      : ""

  const [importText, setImportText] = useState("")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Please paste JSON content")

      return
    }

    try {
      JSON.parse(importText)
    } catch {
      toast.error("Invalid JSON format")

      return
    }

    onImport?.(importText)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-3 rounded-md bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {mode === "view" ? `JSON: ${quizz?.subject}` : "Import from JSON"}
          </h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-xl text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {mode === "view" ? (
          <>
            <pre className="flex-1 overflow-auto rounded bg-gray-900 p-3 text-sm text-green-400">
              {jsonContent}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-md bg-gray-200 p-2 text-lg font-semibold text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
              <Button onClick={handleCopy} className="flex-1">
                Copy to Clipboard
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Paste a quiz JSON below. It should have a &quot;subject&quot; and
              &quot;questions&quot; array.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'{\n  "subject": "My Quiz",\n  "questions": [...]\n}'}
              className="flex-1 resize-none rounded border border-gray-300 bg-gray-50 p-3 font-mono text-sm outline-none focus:border-blue-400"
              rows={12}
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-md bg-gray-200 p-2 text-lg font-semibold text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <Button onClick={handleImport} className="flex-1">
                Import Quiz
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QuizzJsonModal
