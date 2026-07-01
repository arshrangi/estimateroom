// ABOUTME: Copies the room's invite link to the clipboard and reflects a transient "copied" state + toast.
import { inviteUrl } from '~~/shared/invite'

export function useInvite(roomId: string) {
  const copied = ref(false)
  const { show } = useToast()
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl(window.location.origin, roomId))
      copied.value = true
      show('Link copied. Paste it in your meeting chat.')
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), 2000)
    } catch {
      show('Copy failed. Select the link in the address bar to share it.')
    }
  }

  return { copied, copy }
}
