<script setup lang="ts">
  import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

  export interface MentionUser {
    id: string
    username: string
    displayName?: string
    avatar?: string
    status?: 'online' | 'offline' | 'away' | 'dnd'
  }

  const props = defineProps<{
    users: MentionUser[]
    visible: boolean
    position: { top: number; left: number }
    query: string
  }>()

  const emit = defineEmits<{
    (e: 'select', user: MentionUser): void
    (e: 'close'): void
  }>()

  const selectedIndex = ref(0)
  const listRef = ref<HTMLDivElement | null>(null)

  const filteredUsers = computed(() => {
    const q = props.query.toLowerCase()
    return props.users
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      )
      .slice(0, 10)
  })

  const highlightedUser = computed(() => filteredUsers.value[selectedIndex.value])

  function selectUser(user: MentionUser) {
    emit('select', user)
    emit('close')
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!props.visible || filteredUsers.value.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        selectedIndex.value = Math.min(selectedIndex.value + 1, filteredUsers.value.length - 1)
        scrollToSelected()
        break
      case 'ArrowUp':
        e.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
        scrollToSelected()
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (highlightedUser.value) {
          selectUser(highlightedUser.value)
        }
        break
      case 'Escape':
        e.preventDefault()
        emit('close')
        break
    }
  }

  function scrollToSelected() {
    nextTick(() => {
      const item = listRef.value?.children[selectedIndex.value] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    })
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'online':
        return '#43b581'
      case 'away':
        return '#faa61a'
      case 'dnd':
        return '#f04747'
      default:
        return '#747f8d'
    }
  }

  watch(
    () => props.query,
    () => {
      selectedIndex.value = 0
    }
  )

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && filteredUsers.length > 0"
      ref="listRef"
      class="mention-list"
      :style="{ top: position.top + 'px', left: position.left + 'px' }"
      @keydown="handleKeydown"
    >
      <div
        v-for="(user, idx) in filteredUsers"
        :key="user.id"
        class="mention-item"
        :class="{ selected: idx === selectedIndex }"
        @click="selectUser(user)"
        @mouseenter="selectedIndex = idx"
      >
        <div class="mention-avatar">
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.username"
            class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            {{ user.username[0].toUpperCase() }}
          </div>
          <span
            class="status-dot"
            :style="{ backgroundColor: getStatusColor(user.status) }"
          ></span>
        </div>
        <div class="mention-info">
          <span class="mention-username">{{ user.username }}</span>
          <span v-if="user.displayName" class="mention-display">
            {{ user.displayName }}
          </span>
        </div>
        <span class="mention-at">@{{ user.username }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mention-list {
  position: fixed;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 220px;
  max-height: 280px;
  overflow-y: auto;
  animation: slideUp 0.15s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.mention-item:hover,
.mention-item.selected {
  background: var(--bg-hover);
}

.mention-avatar {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-surface);
}

.mention-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mention-username {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-display {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-at {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
  flex-shrink: 0;
}
</style>
