// ABOUTME: A single transient, non-blocking toast message shared across the app.
// ABOUTME: show() sets the message and auto-dismisses it; AppToast renders it in the shell.
export function useToast() {
  const message = useState<string | null>('toast', () => null)
  const timer = useState<ReturnType<typeof setTimeout> | null>('toast-timer', () => null)

  function show(text: string) {
    message.value = text
    if (import.meta.client) {
      if (timer.value) clearTimeout(timer.value)
      timer.value = setTimeout(() => (message.value = null), 3000)
    }
  }

  return { message, show }
}
