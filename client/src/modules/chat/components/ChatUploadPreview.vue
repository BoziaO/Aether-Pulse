<script setup lang="ts">
import { X, Loader2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-vue-next'

import type { UploadState } from '../types/composer.types'

const _props = defineProps<{
  uploads: UploadState[]
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'retry', id: string): void
}>()

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}
</script>

<template>
  <div v-if="uploads.length > 0" class="upload-preview-row">
    <div v-for="upload in uploads" :key="upload.id" class="upload-item">
      <div class="upload-thumb">
        <ImageIcon v-if="isImage(upload.file) && !upload.preview" :size="24" class="thumb-icon" />
        <img
          v-else-if="isImage(upload.file) && upload.preview"
          :src="upload.preview"
          :alt="upload.file.name"
          class="thumb-img"
        />
        <FileText v-else :size="24" class="thumb-icon" />
      </div>

      <div class="upload-info">
        <span class="upload-name">{{ upload.file.name }}</span>
        <span class="upload-size">{{ (upload.file.size / 1024).toFixed(1) }} KB</span>
      </div>

      <div
        v-if="upload.status === 'uploading' || upload.status === 'compressing'"
        class="upload-progress"
      >
        <Loader2 :size="14" class="spin" />
        <span class="progress-text">{{
          upload.status === 'compressing' ? 'Compressing...' : `${upload.progress}%`
        }}</span>
      </div>

      <button
        v-if="upload.status === 'uploaded'"
        class="upload-action"
        aria-label="Remove"
        @click="emit('remove', upload.id)"
      >
        <X :size="14" />
      </button>

      <button
        v-if="upload.status === 'failed'"
        class="upload-action retry"
        aria-label="Retry"
        @click="emit('retry', upload.id)"
      >
        <AlertCircle :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.upload-preview-row {
  display: flex;
  gap: 8px;
  padding: 8px 12px 0;
  flex-wrap: wrap;
}
.upload-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  min-width: 0;
  max-width: 240px;
}
.upload-thumb {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  flex-shrink: 0;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-icon {
  color: var(--text-muted);
}
.upload-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.upload-name {
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}
.upload-size {
  font-size: 10px;
  color: var(--text-muted);
}
.upload-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
}
.progress-text {
  white-space: nowrap;
}
.upload-action {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
}
.upload-action:hover {
  background: var(--bg-hover);
}
.upload-action.retry {
  color: var(--danger);
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
