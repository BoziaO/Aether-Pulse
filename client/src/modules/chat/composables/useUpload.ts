import { useComposerStore } from '../stores/composer.store'
import { useChatStore } from '../stores/chat.store'
import type { ServerMessagePayload } from '../types/message.types'
import {
  validateFile,
  fileToDataUrl,
  compressImage,
  getFilePreviewUrl,
} from '../utils/upload.utils'
import { chatApi } from '../services/chatApi.service'
import { useToastStore } from '@/stores/toast.store'

export function useUpload(roomId: string) {
  const composerStore = useComposerStore()
  const chatStore = useChatStore()
  const toastStore = useToastStore()

  async function uploadFile(file: File): Promise<void> {
    const validation = validateFile(file)
    if (!validation.valid) {
      toastStore.error(validation.error || 'Invalid file')
      return
    }

    composerStore.addUpload(file)
    const uploadId = composerStore.uploads[composerStore.uploads.length - 1].id

    try {
      composerStore.setUploadStatus(uploadId, 'compressing')

      const preview = await getFilePreviewUrl(file)
      composerStore.updateUpload(uploadId, { preview })

      let uploadData = file

      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        const compressed = await compressImage(file)
        uploadData = new File([compressed], file.name, { type: file.type })
      }

      composerStore.setUploadStatus(uploadId, 'uploading')
      composerStore.updateUploadProgress(uploadId, 10)

      const dataUrl = await fileToDataUrl(uploadData)

      composerStore.updateUploadProgress(uploadId, 50)

      const msg = await chatApi.uploadFile(roomId, dataUrl, file.name)

      composerStore.setUploadStatus(uploadId, 'uploaded')
      composerStore.updateUploadProgress(uploadId, 100)

      const payload: ServerMessagePayload = {
        id: msg.serverId || msg.clientId,
        roomId: msg.roomId,
        userId: msg.userId,
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt,
        isDeleted: msg.isDeleted,
        user: msg.user ?? null,
        reactions: msg.reactions ?? null,
        replyTo: msg.replyTo ?? null,
        attachmentUrl: msg.attachments[0]?.url ?? null,
        attachmentName: msg.attachments[0]?.name ?? null,
        attachmentMime: msg.attachments[0]?.mime ?? null,
      }
      chatStore.handleIncomingMessage(payload)
    } catch (e) {
      composerStore.setUploadStatus(uploadId, 'failed')
      toastStore.error(e instanceof Error ? e.message : 'Upload failed')
    }
  }

  async function retryUpload(uploadId: string): Promise<void> {
    const upload = composerStore.uploads.find((u) => u.id === uploadId)
    if (!upload) return
    await uploadFile(upload.file)
    composerStore.removeUpload(uploadId)
  }

  function removeUpload(uploadId: string): void {
    composerStore.removeUpload(uploadId)
  }

  return {
    composerStore,
    uploadFile,
    retryUpload,
    removeUpload,
  }
}
