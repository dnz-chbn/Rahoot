"use client"

import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { STATUS } from "@rahoot/common/types/game/status"
import ManagerPassword from "@rahoot/web/components/game/create/ManagerPassword"
import QuizzEditor from "@rahoot/web/components/game/create/QuizzEditor"
import QuizzJsonModal from "@rahoot/web/components/game/create/QuizzJsonModal"
import SelectQuizz from "@rahoot/web/components/game/create/SelectQuizz"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/stores/manager"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import toast from "react-hot-toast"

type View =
  | { name: "select" }
  | { name: "create" }
  | { name: "edit"; quizz: QuizzWithId }
  | { name: "viewJson"; quizz: QuizzWithId }
  | { name: "import" }

const Manager = () => {
  const { setGameId, setStatus } = useManagerStore()
  const router = useRouter()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])
  const [view, setView] = useState<View>({ name: "select" })

  useEvent("manager:quizzList", (list) => {
    setIsAuth(true)
    setQuizzList(list)
  })

  useEvent("manager:gameCreated", ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setStatus(STATUS.SHOW_ROOM, { text: "Waiting for the players", inviteCode })
    router.push(`/game/manager/${gameId}`)
  })

  useEvent(
    "manager:quizzCreated",
    useCallback(
      (quizz: QuizzWithId) => {
        setQuizzList((prev) => [...prev, quizz])
        setView({ name: "select" })
        toast.success("Quiz created")
      },
      [],
    ),
  )

  useEvent(
    "manager:quizzUpdated",
    useCallback(
      (quizz: QuizzWithId) => {
        setQuizzList((prev) =>
          prev.map((q) => (q.id === quizz.id ? quizz : q)),
        )
        setView({ name: "select" })
        toast.success("Quiz updated")
      },
      [],
    ),
  )

  useEvent(
    "manager:quizzDeleted",
    useCallback(
      (id: string) => {
        setQuizzList((prev) => prev.filter((q) => q.id !== id))
        toast.success("Quiz deleted")
      },
      [],
    ),
  )

  const handleAuth = (password: string) => {
    socket?.emit("manager:auth", password)
  }

  const handleStartGame = (quizzId: string) => {
    socket?.emit("game:create", quizzId)
  }

  const handleCreate = (quizz: Quizz) => {
    socket?.emit("manager:createQuizz", quizz)
  }

  const handleUpdate = (id: string, quizz: Quizz) => {
    socket?.emit("manager:updateQuizz", { id, quizz })
  }

  const handleDelete = (id: string) => {
    socket?.emit("manager:deleteQuizz", id)
  }

  const handleImport = (json: string) => {
    socket?.emit("manager:importQuizz", json)
  }

  if (!isAuth) {
    return <ManagerPassword onSubmit={handleAuth} />
  }

  if (view.name === "create") {
    return (
      <QuizzEditor
        onSave={handleCreate}
        onCancel={() => setView({ name: "select" })}
      />
    )
  }

  if (view.name === "edit") {
    return (
      <QuizzEditor
        initial={view.quizz}
        onSave={(quizz) => handleUpdate(view.quizz.id, quizz)}
        onCancel={() => setView({ name: "select" })}
      />
    )
  }

  return (
    <>
      <SelectQuizz
        quizzList={quizzList}
        onSelect={handleStartGame}
        onEdit={(quizz) => setView({ name: "edit", quizz })}
        onDelete={handleDelete}
        onCreate={() => setView({ name: "create" })}
        onImport={() => setView({ name: "import" })}
        onViewJson={(quizz) => setView({ name: "viewJson", quizz })}
      />

      {view.name === "viewJson" && (
        <QuizzJsonModal
          mode="view"
          quizz={view.quizz}
          onClose={() => setView({ name: "select" })}
        />
      )}

      {view.name === "import" && (
        <QuizzJsonModal
          mode="import"
          onClose={() => setView({ name: "select" })}
          onImport={handleImport}
        />
      )}
    </>
  )
}

export default Manager
