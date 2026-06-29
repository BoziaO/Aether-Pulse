<script setup lang="ts">
  import { computed } from 'vue'
  import { Loader2, Check, CheckCheck, AlertCircle } from 'lucide-vue-next'

  import { MessageStatus } from '../types/message.types'

  const props = defineProps<{
    status: MessageStatus
    isOwn: boolean
  }>()

  const statusIcon = computed(() => {
    if (!props.isOwn) return null
    switch (props.status) {
      case MessageStatus.Sending:
        return Loader2
      case MessageStatus.Sent:
        return Check
      case MessageStatus.Delivered:
        return CheckCheck
      case MessageStatus.Read:
        return CheckCheck
      case MessageStatus.Failed:
        return AlertCircle
      default:
        return null
    }
  })

  const statusClass = computed(() => {
    if (!props.isOwn) return ''
    switch (props.status) {
      case MessageStatus.Sending:
        return 'status-sending'
      case MessageStatus.Sent:
        return 'status-sent'
      case MessageStatus.Delivered:
        return 'status-delivered'
      case MessageStatus.Read:
        return 'status-read'
      case MessageStatus.Failed:
        return 'status-failed'
      default:
        return ''
    }
  })
</script>

<template>
  <span v-if="statusIcon" :class="['message-status', statusClass]">
    <Loader2 v-if="status === MessageStatus.Sending" :size="12" class="spin" />
    <Check v-else-if="status === MessageStatus.Sent" :size="12" />
    <CheckCheck
      v-else-if="status === MessageStatus.Delivered || status === MessageStatus.Read"
      :size="12"
    />
    <AlertCircle v-else-if="status === MessageStatus.Failed" :size="12" />
  </span>
</template>

<style scoped>
.message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
}
.status-sending {
  color: var(--text-muted);
}
.status-sent {
  color: var(--text-muted);
}
.status-delivered {
  color: var(--success);
}
.status-read {
  color: var(--accent-blue);
}
.status-failed {
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
