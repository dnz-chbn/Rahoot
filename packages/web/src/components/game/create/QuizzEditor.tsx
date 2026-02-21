"use client"

import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import clsx from "clsx"
import { useState } from "react"
import toast from "react-hot-toast"

type Question = {
  question: string
  answers: string[]
  solution: number
  cooldown: number
  time: number
  image: string
  video: string
  audio: string
}

const emptyQuestion = (): Question => ({
  question: "",
  answers: ["", ""],
  solution: 0,
  cooldown: 5,
  time: 15,
  image: "",
  video: "",
  audio: "",
})

type Props = {
  initial?: QuizzWithId
  onSave: (_quizz: Quizz) => void
  onCancel: () => void
}

const QuizzEditor = ({ initial, onSave, onCancel }: Props) => {
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [questions, setQuestions] = useState<Question[]>(
    initial?.questions.map((q) => ({
      ...q,
      image: q.image ?? "",
      video: q.video ?? "",
      audio: q.audio ?? "",
    })) ?? [emptyQuestion()],
  )
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    )
  }

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1

    if (target < 0 || target >= questions.length) {
      return
    }

    setQuestions((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]

      return next
    })

    if (expandedIndex === index) {
      setExpandedIndex(target)
    } else if (expandedIndex === target) {
      setExpandedIndex(index)
    }
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
    setExpandedIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("Quiz must have at least 1 question")

      return
    }

    setQuestions((prev) => prev.filter((_, i) => i !== index))

    if (expandedIndex === index) {
      setExpandedIndex(null)
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1)
    }
  }

  const addAnswer = (qIndex: number) => {
    const q = questions[qIndex]

    if (q.answers.length >= 4) {
      return
    }

    updateQuestion(qIndex, { answers: [...q.answers, ""] })
  }

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const q = questions[qIndex]

    if (q.answers.length <= 2) {
      return
    }

    const newAnswers = q.answers.filter((_, i) => i !== aIndex)
    const newSolution =
      q.solution === aIndex
        ? 0
        : q.solution > aIndex
          ? q.solution - 1
          : q.solution

    updateQuestion(qIndex, { answers: newAnswers, solution: newSolution })
  }

  const updateAnswer = (qIndex: number, aIndex: number, value: string) => {
    const q = questions[qIndex]
    const newAnswers = [...q.answers]
    newAnswers[aIndex] = value
    updateQuestion(qIndex, { answers: newAnswers })
  }

  const handleSave = () => {
    if (!subject.trim()) {
      toast.error("Subject is required")

      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} text is required`)

        return
      }

      if (q.answers.some((a) => !a.trim())) {
        toast.error(`Question ${i + 1} has empty answers`)

        return
      }
    }

    const quizz: Quizz = {
      subject: subject.trim(),
      questions: questions.map((q) => ({
        question: q.question.trim(),
        answers: q.answers.map((a) => a.trim()),
        solution: q.solution,
        cooldown: q.cooldown,
        time: q.time,
        ...(q.image ? { image: q.image } : {}),
        ...(q.video ? { video: q.video } : {}),
        ...(q.audio ? { audio: q.audio } : {}),
      })),
    }

    onSave(quizz)
  }

  const answerColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
  ]

  return (
    <div className="z-10 flex w-full max-w-2xl flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
      <h1 className="text-center text-2xl font-bold">
        {initial ? "Edit Quiz" : "New Quiz"}
      </h1>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-600">
          Subject
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Quiz subject"
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Questions ({questions.length})
          </h2>
          <button
            onClick={addQuestion}
            className="rounded bg-green-500 px-3 py-1 text-sm font-semibold text-white hover:bg-green-600"
          >
            + Add Question
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="rounded-md border border-gray-200 bg-gray-50"
          >
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === qIndex ? null : qIndex)
                }
                className="flex-1 text-left font-semibold"
              >
                {qIndex + 1}. {q.question || "(untitled)"}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveQuestion(qIndex, "up")}
                  disabled={qIndex === 0}
                  className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveQuestion(qIndex, "down")}
                  disabled={qIndex === questions.length - 1}
                  className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === qIndex ? null : qIndex)
                  }
                  className="ml-1 rounded px-1.5 py-0.5 text-sm text-gray-400 hover:bg-gray-200"
                  title={expandedIndex === qIndex ? "Collapse" : "Expand"}
                >
                  {expandedIndex === qIndex ? "−" : "+"}
                </button>
              </div>
            </div>

            {expandedIndex === qIndex && (
              <div className="flex flex-col gap-3 border-t border-gray-200 p-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-600">
                    Question text
                  </label>
                  <Input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(qIndex, { question: e.target.value })
                    }
                    placeholder="Enter question"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-600">
                      Answers
                    </label>
                    {q.answers.length < 4 && (
                      <button
                        onClick={() => addAnswer(qIndex)}
                        className="text-sm text-blue-500 hover:underline"
                      >
                        + Add answer
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {q.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "h-8 w-2 shrink-0 rounded-full",
                            answerColors[aIndex],
                          )}
                        />
                        <Input
                          value={answer}
                          onChange={(e) =>
                            updateAnswer(qIndex, aIndex, e.target.value)
                          }
                          placeholder={`Answer ${aIndex + 1}`}
                          className="flex-1"
                        />
                        <button
                          onClick={() =>
                            updateQuestion(qIndex, { solution: aIndex })
                          }
                          className={clsx(
                            "shrink-0 rounded px-2 py-1 text-xs font-bold",
                            q.solution === aIndex
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                          )}
                          title="Mark as correct answer"
                        >
                          ✓
                        </button>
                        {q.answers.length > 2 && (
                          <button
                            onClick={() => removeAnswer(qIndex, aIndex)}
                            className="shrink-0 rounded px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                            title="Remove answer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-gray-600">
                      Cooldown (s)
                      <span
                        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white"
                        title="Seconds to display the question before players can answer. Gives everyone time to read the question."
                      >
                        i
                      </span>
                    </label>
                    <Input
                      type="number"
                      value={q.cooldown}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          cooldown: Math.max(1, Number(e.target.value)),
                        })
                      }
                      min={1}
                      max={60}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-semibold text-gray-600">
                      Time limit (s)
                      <span
                        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white"
                        title="Seconds players have to submit their answer after the cooldown ends. When time runs out, unanswered players score zero."
                      >
                        i
                      </span>
                    </label>
                    <Input
                      type="number"
                      value={q.time}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          time: Math.max(5, Number(e.target.value)),
                        })
                      }
                      min={5}
                      max={120}
                      className="w-full"
                    />
                  </div>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold text-gray-500 hover:text-gray-700">
                    Media (optional)
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      value={q.image}
                      onChange={(e) =>
                        updateQuestion(qIndex, { image: e.target.value })
                      }
                      placeholder="Image URL"
                      className="w-full text-sm"
                    />
                    <Input
                      value={q.video}
                      onChange={(e) =>
                        updateQuestion(qIndex, { video: e.target.value })
                      }
                      placeholder="Video URL"
                      className="w-full text-sm"
                    />
                    <Input
                      value={q.audio}
                      onChange={(e) =>
                        updateQuestion(qIndex, { audio: e.target.value })
                      }
                      placeholder="Audio URL"
                      className="w-full text-sm"
                    />
                  </div>
                </details>

                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="self-end rounded bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Delete Question
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-md bg-gray-200 p-2 text-lg font-semibold text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <Button onClick={handleSave} className="flex-1">
          {initial ? "Save Changes" : "Create Quiz"}
        </Button>
      </div>
    </div>
  )
}

export default QuizzEditor
