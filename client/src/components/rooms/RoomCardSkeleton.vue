<template>
  <div class="room-card-skeleton">
    <div class="skeleton-icon" />
    <div class="skeleton-info">
      <div class="skeleton-name" />
      <div class="skeleton-meta" />
    </div>
    <div class="skeleton-arrow" />
  </div>
</template>

<style scoped>
.room-card-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-hover);
  animation: pulse 1.5s infinite;
}
.skeleton-info { flex: 1; }
.skeleton-name {
  height: 16px;
  width: 60%;
  background: var(--bg-hover);
  border-radius: 4px;
  margin-bottom: 6px;
  animation: pulse 1.5s infinite;
}
.skeleton-meta {
  height: 12px;
  width: 40%;
  background: var(--bg-hover);
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}
.skeleton-arrow {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--bg-hover);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
