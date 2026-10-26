import { useState } from 'react'

/** On/off state for a list of ids; everything starts enabled. */
export function useToggleSet() {
  const [disabled, setDisabled] = useState<Record<string, boolean>>({})
  return {
    isOn: (id: string) => !disabled[id],
    setMany: (ids: string[], on: boolean) => setDisabled(current => ({ ...current, ...Object.fromEntries(ids.map(id => [id, !on])) })),
  }
}

export type ToggleSet = ReturnType<typeof useToggleSet>
