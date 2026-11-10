import { post, request } from './auth'

export type TicketMessage = {
  author: 'user' | 'staff'
  body: string
  /** "YYYY-MM-DD HH:MM:SS" in UTC. */
  date: string
}

export type Ticket = {
  id: number
  subject: string
  status: 'open' | 'answered' | 'closed'
  date: string
  /** A staff answer the user has not opened yet. */
  unread: boolean
  messages: TicketMessage[]
}

export async function fetchTickets(): Promise<{ tickets: Ticket[]; unread: number }> {
  return request<{ tickets: Ticket[]; unread: number }>('tickets')
}

export async function createTicket(subject: string, body: string): Promise<{ id: number }> {
  return post<{ id: number }>('ticket-create', { subject, body })
}

export async function replyToTicket(id: number, body: string): Promise<void> {
  await post('ticket-reply', { id, body })
}

export async function markTicketRead(id: number): Promise<void> {
  await post('ticket-read', { id })
}
