<template>
  <div class="relative max-w-full w-full px-1.5 md:px-2">
    <Card 
      class="group relative cursor-pointer transition-all duration-200 hover:shadow-lg border border-border/30 hover:border-primary/30 bg-card w-full overflow-visible hover-lift focus-within:ring-2 focus-within:ring-primary/40"
      @click="toggleExpanded"
    >
      <div class="absolute left-0 top-0 bottom-0 w-1.5" :style="{ backgroundColor: appHexColor }"></div>
      
      <div class="pl-4 pr-4 py-2.5 ml-2">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2.5 flex-1">
            <span class="text-[13px] font-semibold tracking-tight text-[var(--theme-text-primary)] whitespace-nowrap" title="Project">
              {{ getDisplayName(event.source_app) }}
            </span>
            <Badge variant="outline" class="font-mono text-[10px] px-1.5 py-0.5 rounded-sm shrink-0" title="Session">
              {{ sessionIdShort }}
            </Badge>
            <Badge v-if="agentName" variant="secondary" class="text-[11px] px-2 py-0.5 truncate max-w-[30%]" title="Agent">
              {{ agentName }}
            </Badge>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <Badge variant="secondary" class="gap-1 px-2 py-0.5 text-[11px] leading-4">
                <component :is="eventIcon" class="h-3.5 w-3.5 text-primary" />
                <span class="font-medium text-[var(--theme-text-primary)]">{{ event.hook_event_type }}</span>
              </Badge>
              <span v-if="toolInfo?.tool && toolInfo.tool !== 'Prompt'" class="text-[12px] text-[var(--theme-text-secondary)] truncate max-w-[50%]">
                {{ toolInfo.tool }}
              </span>
            </div>

            <div v-if="!isGroup">
              <div class="flex items-center gap-2 text-[13px] leading-5 mb-0.5">
                <span class="font-medium text-[var(--theme-text-primary)]" v-if="toolInfo?.detail">Details</span>
                <span v-if="toolInfo?.detail" class="text-[12px] text-[var(--theme-text-secondary)] truncate max-w-[60%]" 
                      :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">
                  {{ toolInfo.detail }}
                </span>
              </div>
            </div>
            
            <div v-if="event.summary" class="text-[12.5px] text-[var(--theme-text-secondary)] leading-5 line-clamp-2">
              {{ event.summary }}
            </div>
            
            <div v-if="isGroup" class="space-y-1.5">
              <div class="text-[13px] font-medium text-[var(--theme-text-primary)]">
                {{ groupMeta.tool || actionLabel }} • {{ groupMeta.count }} operations
              </div>
              <div class="flex flex-wrap gap-1.5">
                <Badge 
                  v-for="(chip, i) in readFilesUnique.slice(0,4)" 
                  :key="chip+i"
                  variant="outline"
                  class="text-[10px] px-1.5 py-0.5 rounded-sm"
                >
                  {{ chip }}
                </Badge>
                <span v-if="readFilesUnique.length > 4" class="text-[11px] text-[var(--theme-text-tertiary)]">
                  +{{ readFilesUnique.length - 4 }}
                </span>
              </div>
            </div>
          </div>

          <button 
            class="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)] p-1 rounded-md hover:bg-[var(--theme-hover-bg)]"
            aria-label="More"
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
    <ChatTranscriptModal 
      v-if="frozenChatData.length > 0"
      :key="`chat-modal-${event.session_id}-${event.timestamp}`"
      :is-open="showChatModal"
      :chat="frozenChatData"
      @close="showChatModal = false; frozenChatData = [];"
    />
    <EventDetailsModal 
      v-if="showDetailsModal && !(event.hook_event_type === 'Stop' && event.chat && event.chat.length > 0)" 
      :is-open="showDetailsModal" 
      :event="event" 
      @close="showDetailsModal = false" 
    />
  </div>
</template>

<style scoped>
.node:hover .dot { 
  transform: scale(1.25); 
  filter: brightness(1.2);
}

.expand-enter-active,
.expand-leave-active {
  transition: opacity 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
              transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
              max-height 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
              padding 200ms ease;
  will-change: max-height, transform, opacity;
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  max-height: 1000px;
}

.expand-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  max-height: 1000px;
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

:global(.event-move) { 
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1); 
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px) scale(1.005);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive adjustments for full-width cards */
@media (max-width: 768px) {
  .hover-lift:hover {
    transform: translateY(-1px) scale(1.002);
  }
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Check, MessageSquare, Wrench, Bell, Square, Box, MoreHorizontal } from 'lucide-vue-next';
import type { HookEvent } from '~/types';
import ChatTranscriptModal from './ChatTranscriptModal.vue';
import EventDetailsModal from './EventDetailsModal.vue';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';
import { useAppNames } from '~/composables/useAppNames';
import { useMediaQuery } from '~/composables/useMediaQuery';

const props = defineProps<{
  event: HookEvent;
  gradientClass: string;
  colorClass: string;
  appGradientClass: string;
  appColorClass: string;
  appHexColor: string;
}>();

// Use friendly app names composable
const { getDisplayName } = useAppNames()
const { isMobile } = useMediaQuery()

const showChatModal = ref(false);
const showDetailsModal = ref(false);

// Store a frozen copy of chat data to prevent re-renders
const frozenChatData = ref<any[]>([]);

const toggleExpanded = () => {
  // For Stop events with chat data, open chat modal directly
  if (props.event.hook_event_type === 'Stop' && props.event.chat && props.event.chat.length > 0) {
    // Create a deep frozen copy of the chat data to prevent re-renders
    frozenChatData.value = JSON.parse(JSON.stringify(props.event.chat));
    showChatModal.value = true;
  } else {
    showDetailsModal.value = true;
  }
};

const sessionIdShort = computed(() => {
  return props.event.session_id.slice(0, 8);
});

const eventIcon = computed(() => {
  switch (props.event.hook_event_type) {
    case 'PreToolUse':
      return Wrench;
    case 'PostToolUse':
      return Check;
    case 'Notification':
      return Bell;
    case 'Stop':
      return Square;
    case 'PreCompact':
      return Box;
    default:
      return MessageSquare;
  }
});

const actionLabel = computed(() => {
  const t = (groupMeta.value.tool || '').toLowerCase();
  if (t.includes('read')) return 'Read';
  if (t.includes('multi') && t.includes('write')) return 'MultiWrite';
  if (t.includes('todo')) return 'ToDoWrite';
  if (t.includes('write')) return 'Write';
  if (t.includes('exit')) return 'ExitPlanMode';
  return 'Action';
});

const borderColorClass = computed(() => {
  // Convert bg-color-500 to border-color-500
  return props.colorClass.replace('bg-', 'border-');
});

const appBorderStyle = computed(() => {
  return {
    borderColor: props.appHexColor
  };
});

const appBgStyle = computed(() => {
  // Use the hex color with 20% opacity
  return {
    backgroundColor: props.appHexColor + '33' // Add 33 for 20% opacity in hex
  };
});

const isGroup = computed(() => (props.event as any).meta?.group === 'aggregate');
const agentName = computed(() => (props.event as any).agent_name || (props.event as any).meta?.agent || '');
const groupMeta = computed(() => (props.event as any).meta || {});
const readFiles = computed<string[]>(() => groupMeta.value.chips || []);
const readFilesUnique = computed<string[]>(() => Array.from(new Set(readFiles.value)));

const toolInfo = computed(() => {
  const payload = props.event.payload;
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return { tool: 'Prompt', detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"` };
  }
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name };
    if (payload.tool_input) {
      if (payload.tool_input.command) info.detail = payload.tool_input.command.slice(0, 50) + (payload.tool_input.command.length > 50 ? '...' : '');
      else if (payload.tool_input.file_path) info.detail = payload.tool_input.file_path.split('/').pop();
      else if (payload.tool_input.pattern) info.detail = payload.tool_input.pattern;
    }
    return info;
  }
  return null;
});

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>