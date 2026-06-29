import { useSettingsStore } from '@/stores/settings.store'

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function notifyNewMessage(title: string, body: string, onClick?: () => void) {
  const settings = useSettingsStore()
  if (!settings.messageNotifications) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!document.hidden) return

  const n = new Notification(title, {
    body,
    icon: '/icons/logo.png',
    tag: 'nicori-message',
  })
  if (onClick) {
    n.onclick = () => {
      window.focus()
      onClick()
      n.close()
    }
  }
}
