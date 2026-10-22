export interface Note {
  id: number
  userId: number
  content: string
}

export const notes: Note[] = [
  {
    id: 101,
    userId: 1,
    content: "Alice's private note"
  },
  {
    id: 102,
    userId: 2,
    content: "Bob's private note"
  }
]