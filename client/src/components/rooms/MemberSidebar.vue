<script setup lang="ts">
  import { computed } from 'vue'
  import { Headphones, Mic } from 'lucide-vue-next'

  import UserAvatar from '@/components/profile/UserAvatar.vue'
  import { useRtcStore } from '@/stores/rtc.store'
  import { usePresenceStore } from '@/stores/presence.store'
  import type { User } from '@/types/user.types'

  const props = defineProps<{
    members: User[]
  }>()

  const emit = defineEmits<{
    (e: 'open-profile', userId: string): void
  }>()

  const rtc = useRtcStore()
  const presence = usePresenceStore()

  const sortedMembers = computed(() =>
    [...props.members].sort((a, b) => {
      const aOnline = presence.isOnlineInRoom(a.id) ? 0 : 1
      const bOnline = presence.isOnlineInRoom(b.id) ? 0 : 1
      if (aOnline !== bOnline) return aOnline - bOnline
      return a.displayName.localeCompare(b.displayName)
    })
  )

  function isInCall(userId: string) {
    return rtc.callUsers.has(userId)
  }

  function isOnline(userId: string) {
    return presence.isOnlineInRoom(userId)
  }
</script>

<template>
  <aside class="member-sidebar">
    <div class="sidebar-header">
      <h3>Members</h3>
      <span>{{ members.length }}</span>
    </div>

    <div class="member-list">
      <button
        v-for="member in sortedMembers"
        :key="member.id"
        class="member-row"
        type="button"
        @click="emit('open-profile', member.id)"
      >
        <UserAvatar :user="member" :size="34" />
        <div class="member-info">
          <span class="member-name">{{ member.displayName }}</span>
          <span class="member-meta">
            <span v-if="isInCall(member.id)" class="badge in-call"
            ><Mic :size="10" /> In voice</span
            >
            <span v-else-if="isOnline(member.id)" class="badge online">Online</span>
            <span v-else class="badge offline">{{ member.status }}</span>
          </span>
        </div>
        <Headphones v-if="isInCall(member.id)" :size="14" class="call-icon" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.member-sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.sidebar-header h3 {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.sidebar-header span {
  font-size: 12px;
  color: var(--text-muted);
}
.member-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.member-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
}
.member-row:hover {
  background: var(--bg-hover);
}
.member-info {
  flex: 1;
  min-width: 0;
}
.member-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-meta {
  display: block;
  margin-top: 2px;
}
.badge {
  font-size: 11px;
  text-transform: capitalize;
}
.badge.online {
  color: var(--success);
}
.badge.offline {
  color: var(--text-muted);
}
.badge.in-call {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-violet);
}
.call-icon {
  color: var(--accent-violet);
  flex-shrink: 0;
}
</style>
