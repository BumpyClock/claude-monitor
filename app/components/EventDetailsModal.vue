<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleOpenChange(false)"></div>
    <div class="relative bg-background border rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
      <div class="border-b p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <component :is="eventIcon" class="h-6 w-6 text-primary" />
            <h2 class="text-xl font-semibold">{{ event.hook_event_type }}</h2>
            <Badge variant="outline" size="sm" class="ml-2 font-mono text-xs">
              {{ formatTime(event.timestamp) }}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" @click="handleOpenChange(false)">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto space-y-6 p-4">
        <!-- App and Session Info -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <Badge variant="secondary" size="lg" class="font-semibold">
              📱 {{ event.source_app }}
            </Badge>
            <Badge variant="outline" size="sm" class="font-mono">
              🆔 {{ sessionIdShort }}
            </Badge>
          </div>
        </div>
        
        <!-- Tool Information -->
        <Card v-if="toolInfo" class="p-4 bg-primary/5 border-primary/20">
          <div class="flex items-center gap-3 mb-3">
            <component :is="actionIcon" class="h-6 w-6 text-primary" />
            <div>
              <h3 class="font-semibold text-lg">{{ toolInfo.tool }}</h3>
              <p v-if="toolInfo.detail" class="text-sm text-muted-foreground" :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">
                {{ toolInfo.detail }}
              </p>
            </div>
          </div>
        </Card>
        
        <!-- Summary -->
        <Card v-if="event.summary" class="p-4 bg-secondary/5 border-secondary/20">
          <div class="flex items-start gap-3">
            <FileText class="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
            <div>
              <h3 class="font-semibold mb-1">Summary</h3>
              <p class="text-sm leading-relaxed">{{ event.summary }}</p>
            </div>
          </div>
        </Card>
        
        <!-- Payload -->
        <Card class="overflow-hidden">
          <div class="p-4 bg-muted/30 border-b">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Package class="h-5 w-5 text-primary" />
                <h3 class="font-semibold">Event Payload</h3>
              </div>
              <Button
                @click="copyPayload"
                variant="outline"
                size="sm"
                class="gap-2"
                :disabled="copyButtonIcon !== 'copy'"
              >
                <Copy v-if="copyButtonIcon === 'copy'" class="h-4 w-4" />
                <Check v-else-if="copyButtonIcon === 'check'" class="h-4 w-4 text-green-500" />
                <X v-else class="h-4 w-4 text-red-500" />
                {{ copyButtonTitle }}
              </Button>
            </div>
          </div>
          <div class="p-0">
            <pre class="p-4 text-sm font-mono bg-background overflow-x-auto max-h-96 leading-relaxed">{{ formattedPayload }}</pre>
          </div>
        </Card>
      </div>

      <div class="border-t p-4">
        <div class="flex justify-end">
          <Button @click="handleOpenChange(false)" variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Wrench, Check, Bell, Square, Box, MessageSquare, Copy, FileText, Package, Pencil, ListTodo, Files, LogOut, X } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'

// Use the standard HookEvent interface from ~/types
import type { HookEvent } from '~/types'

const props = defineProps<{ 
  isOpen: boolean
  event: HookEvent 
}>()

const emit = defineEmits<{ 
  close: [] 
}>()

const copyButtonText = ref('Copy Payload')
const copyButtonIcon = computed(() => 
  copyButtonText.value === 'Copied!' ? 'check' : 
  copyButtonText.value === 'Failed to Copy' ? 'x' : 'copy'
)
const copyButtonTitle = computed(() => copyButtonText.value)

const handleOpenChange = (open: boolean) => {
  if (!open) {
    emit('close')
  }
}

const formatTime = (timestamp: number | string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const sessionIdShort = computed(() => props.event.session_id.slice(0, 8))

const formattedPayload = computed(() => {
  return JSON.stringify(props.event.payload, null, 2)
})

const toolInfo = computed(() => {
  const payload = props.event.payload
  
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return {
      tool: 'User Prompt',
      detail: `"${payload.prompt.slice(0, 200)}${payload.prompt.length > 200 ? '...' : ''}"`
    }
  }
  
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name }
    
    if (payload.tool_input) {
      if (payload.tool_input.command) {
        info.detail = payload.tool_input.command.slice(0, 100) + (payload.tool_input.command.length > 100 ? '...' : '')
      } else if (payload.tool_input.file_path) {
        info.detail = payload.tool_input.file_path.split('/').pop()
      } else if (payload.tool_input.pattern) {
        info.detail = payload.tool_input.pattern
      }
    }
    
    return info
  }
  
  return null
})

const actionIcon = computed(() => {
  const tool = toolInfo.value?.tool?.toLowerCase() || ''
  if (tool.includes('read')) return FileText
  if (tool.includes('write') && tool.includes('multi')) return Files
  if (tool.includes('todowrite') || tool.includes('todo')) return ListTodo
  if (tool.includes('write')) return Pencil
  if (tool.includes('exit')) return LogOut
  return Package
})

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(formattedPayload.value)
    copyButtonText.value = 'Copied!'
    setTimeout(() => {
      copyButtonText.value = 'Copy Payload'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    copyButtonText.value = 'Failed to Copy'
    setTimeout(() => {
      copyButtonText.value = 'Copy Payload'
    }, 2000)
  }
}

const eventIcon = computed(() => {
  switch (props.event.hook_event_type) {
    case 'PreToolUse': return Wrench
    case 'PostToolUse': return Check
    case 'Notification': return Bell
    case 'Stop': return Square
    case 'PreCompact': return Box
    default: return MessageSquare
  }
})
</script>