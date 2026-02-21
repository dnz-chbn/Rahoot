import z from "zod"

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  answers: z
    .array(z.string().min(1, "Answer cannot be empty"))
    .min(2, "At least 2 answers required")
    .max(4, "Maximum 4 answers"),
  solution: z.number().min(0, "Solution index is required"),
  cooldown: z.number().min(1).max(60).default(5),
  time: z.number().min(5).max(120).default(15),
  image: z.string().url().optional().or(z.literal("")),
  video: z.string().url().optional().or(z.literal("")),
  audio: z.string().url().optional().or(z.literal("")),
})

export const quizzSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100),
  questions: z
    .array(questionSchema)
    .min(1, "At least 1 question is required"),
})

export type QuizzInput = z.infer<typeof quizzSchema>
export type QuestionInput = z.infer<typeof questionSchema>
