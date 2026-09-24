import { ThemeProvider } from 'next-themes'

export function Provider({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
