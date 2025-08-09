<template>
  <button
    @click="$emit('toggle')"
    class="fixed bottom-6 right-6 mobile:bottom-4 mobile:right-4 p-3 mobile:p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center border backdrop-blur-sm transform hover:scale-110"
    :class="[
      stickToBottom 
        ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white border-[var(--theme-primary-dark)]/50 shadow-lg' 
        : 'bg-[var(--theme-bg-primary)]/90 hover:bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] border-[var(--theme-border-primary)]/30 hover:border-[var(--theme-primary)]/50'
    ]"
    :title="stickToBottom ? 'Disable auto-scroll' : 'Enable auto-scroll'"
  >
    <component 
      :is="stickToBottom ? ArrowUpToLine : ArrowUp"
      class="w-5 h-5 mobile:w-4 mobile:h-4"
    />
  </button>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowUpToLine } from 'lucide-vue-next';

defineProps<{
  stickToBottom: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>