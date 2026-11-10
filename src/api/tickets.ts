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
  messages: TicketMessage[]
}

export async function fetchTickets(): Promise<Ticket[]> {
  return (await request<{ tickets: Ticket[] }>('tickets')).tickets
}

export async function createTicket(subject: string, body: string): Promise<void> {
  await post('ticket-create', { subject, body })
}

export async function replyToTicket(id: number, body: string): Promise<void> {
  await post('ticket-reply', { id, body })
}
