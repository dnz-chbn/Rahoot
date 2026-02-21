import { QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import clsx from "clsx"
import { useState } from "react"
import toast from "react-hot-toast"

type Props = {
  quizzList: QuizzWithId[]
  onSelect: (_id: string) => void
  onEdit: (_quizz: QuizzWithId) => void
  onDelete: (_id: string) => void
  onCreate: () => void
  onImport: () => void
  onViewJson: (_quizz: QuizzWithId) => void
}

const SelectQuizz = ({
  quizzList,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  onImport,
  onViewJson,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (id: string) => () => {
    if (selected === id) {
      setSelected(null)
    } else {
      setSelected(id)
    }
  }

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a quizz")

      return
    }

    onSelect(selected)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (confirm("Are you sure you want to delete this quiz?")) {
      onDelete(id)

      if (selected === id) {
        setSelected(null)
      }
    }
  }

  return (
    <div className="z-10 flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl font-bold">Select a quizz</h1>
        <div className="w-full space-y-2">
          {quizzList.map((quizz) => (
            <div
              key={quizz.id}
              className={clsx(
                "rounded-md outline outline-gray-300",
                selected === quizz.id && "outline-primary outline-2",
              )}
            >
              <button
                className="flex w-full items-center justify-between p-3"
                onClick={handleSelect(quizz.id)}
              >
                <div className="text-left">
                  <span className="font-semibold">{quizz.subject}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {quizz.questions.length} question
                    {quizz.questions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div
                  className={clsx(
                    "h-5 w-5 shrink-0 rounded outline outline-offset-3 outline-gray-300",
                    selected === quizz.id &&
                      "bg-primary border-primary/80 shadow-inset",
                  )}
                ></div>
              </button>
              <div className="flex gap-1 border-t border-gray-100 px-3 py-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(quizz)
                  }}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-blue-500 hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewJson(quizz)
                  }}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  JSON
                </button>
                <button
                  onClick={(e) => handleDelete(e, quizz.id)}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {quizzList.length === 0 && (
            <p className="py-4 text-center text-gray-400">
              No quizzes yet. Create one or import from JSON.
            </p>
          )}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!selected}>
        Start Game
      </Button>

      <div className="flex gap-2">
        <button
          onClick={onCreate}
          className="flex-1 rounded-md bg-green-500 p-2 text-sm font-semibold text-white hover:bg-green-600"
        >
          + New Quiz
        </button>
        <button
          onClick={onImport}
          className="flex-1 rounded-md bg-gray-200 p-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
        >
          Import JSON
        </button>
      </div>
    </div>
  )
}

export default SelectQuizz
