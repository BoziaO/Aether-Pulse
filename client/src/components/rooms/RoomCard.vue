<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { Hash, ArrowRight } from 'lucide-vue-next'

  import AnimatedCard from '@/components/ui/AnimatedCard.vue'
  import type { Room } from '@/types/room.types'

  const _props = defineProps<{ room: Room; isOwner?: boolean }>()
  const router = useRouter()
</script>

<template>
  <AnimatedCard variant="glass" :hoverable="true" class="room-card-wrap" @click="router.push(`/app/room/${room.id}`)">
    <div class="room-card">
      <div class="room-icon">
        <Hash :size="20" />
      </div>
      <div class="room-info">
        <div class="room-name">{{ room.name }}</div>
        <div class="room-meta">
          <span v-if="room.isActive" class="room-live">● Live</span>
          <span class="room-code">{{ room.inviteCode }}</span>
        </div>
      </div>
      <ArrowRight :size="16" class="room-arrow" />
    </div>
  </AnimatedCard>
</template>

<style scoped>
.room-card-wrap {
  cursor: pointer;
}

.room-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.room-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-violet);
  flex-shrink: 0;
}
.room-info {
  flex: 1;
  min-width: 0;
}
.room-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.room-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}
.room-live {
  font-size: 11px;
  color: var(--danger);
  font-weight: 700;
}
.room-code {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}
.room-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
