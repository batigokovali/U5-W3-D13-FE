export type User = {
  username: string
  socketId: string
}

export type Message = {
  sender: string
  text: string
  createdAt: string
  socketID: string
}

export type CurentID = {
  currentID: string
}