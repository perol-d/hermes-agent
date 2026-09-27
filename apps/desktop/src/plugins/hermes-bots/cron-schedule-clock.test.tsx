/**
 * The schedule picker's time labels come from the app's canonical clock
 * formatter (`fmtClock`, re-exported by the plugin SDK), the same one every
 * other timestamp in the app uses. Building a private `Intl.DateTimeFormat`
 * from the UI language made the picker disagree with the rest of the app
 * whenever the UI language and the system locale use different hour cycles
 * (English UI on a 24-hour system showed "9:00 AM" here and "09:00" elsewhere).
 */

import type * as HermesSdk from '@hermes/plugin-sdk'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { translateBots } from './i18n-test-helper'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

vi.mock('@hermes/plugin-sdk', async importOriginal => {
  const sdk = await importOriginal<typeof HermesSdk>()

  return {
    ...sdk,
    // A formatter no locale produces: proves the picker reads the shared one.
    fmtClock: { format: (date: Date) => `clock ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}` },
    host: { ...sdk.host, notify: vi.fn(), request: vi.fn(async () => ({})) },
    usePluginI18n: () => translateBots
  }
})

const { CreateRoutineDialog } = await import('./cron')

afterEach(() => {
  cleanup()
})

describe('schedule picker clock', () => {
  it('labels times with the app clock formatter, not a UI-language formatter', () => {
    render(<CreateRoutineDialog bot={{ name: 'ops' }} onClose={() => undefined} open />)

    const dialog = screen.getByRole('dialog')

    // The default daily schedule runs at 09:00.
    expect(dialog.textContent).toContain('clock 9h00')
    expect(dialog.textContent).not.toMatch(/9:00\s?AM/)
  })
})
