import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function pickMenu(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByLabelText(label))
  await userEvent.click(screen.getByRole('option', { name: option }))
}
