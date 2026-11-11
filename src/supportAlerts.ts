import type { Ticket } from './api/tickets'

/** Fired on `window` when a new answer from support arrives while the site is open. */
export const SUPPORT_ANSWER_EVENT = 'tp-support-answer'

let knownAnswers: number | null = null
let audio: AudioContext | null = null

/** A short two-note chime made in the browser, so no sound file has to be loaded. */
function playChime() {
  try {
    audio = audio ?? new AudioContext()
    void audio.resume()
    const now = audio.currentTime
    ;[[880, 0], [1318.5, 0.14]].forEach(([frequency, delay]) => {
      const oscillator = audio!.createOscillator()
      const gain = audio!.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.45)
      oscillator.connect(gain).connect(audio!.destination)
      oscillator.start(now + delay)
      oscillator.stop(now + delay + 0.5)
    })
  } catch {
    // The browser may block sound until the visitor has interacted with the page.
  }
}

/** Call with every fresh ticket list: a growing number of staff messages means a new answer. */
export function noteTickets(tickets: Ticket[]) {
  const answers = tickets.reduce((sum, ticket) => sum + ticket.messages.filter(message => message.author === 'staff').length, 0)
  const isNew = knownAnswers !== null && answers > knownAnswers
  knownAnswers = answers
  if (!isNew) return
  playChime()
  window.dispatchEvent(new Event(SUPPORT_ANSWER_EVENT))
}

/** Forget what was seen, so the next account starts from its own tickets. */
export function resetTicketAlerts() {
  knownAnswers = null
}
