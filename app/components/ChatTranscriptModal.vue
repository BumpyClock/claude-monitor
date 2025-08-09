<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleDialogChange(false)"></div>
    <div class="relative bg-background border rounded-lg max-w-6xl w-[95vw] h-[95vh] mobile:max-w-full mobile:w-full mobile:h-full mobile:rounded-none p-0 gap-0 overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex-shrink-0 bg-background border-b p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl sm:text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <MessageSquare class="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Chat Transcript
          </h2>
          <Button variant="ghost" size="sm" @click="handleDialogChange(false)">
            <X class="w-4 h-4" />
          </Button>
        </div>
        
        <!-- Search and Filters -->
        <div class="space-y-3 sm:space-y-4">
          <!-- Search Input -->
          <div class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
              <input
                v-model="searchQuery"
                @keyup.enter="executeSearch"
                type="text"
                placeholder="Search transcript..."
                class="w-full pl-10 h-10 sm:h-12 text-base bg-background border border-border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
              />
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <div class="flex gap-2">
              <Button
                @click="executeSearch"
                class="h-10 sm:h-12 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Search class="w-4 h-4 mr-2" />
                <span class="hidden sm:inline">Search</span>
              </Button>
              <Button
                @click="copyAllMessages"
                variant="secondary"
                class="h-10 sm:h-12 px-4 bg-secondary hover:bg-secondary/80"
                :title="'Copy all messages as JSON'"
              >
                <Copy class="w-4 h-4 mr-2" />
                <span class="hidden sm:inline">{{ copyAllButtonText.replace(/📋|✅|❌/g, '').trim() }}</span>
                <component :is="copyAllButtonText.includes('Copied') ? CheckCircle : copyAllButtonText.includes('Failed') ? X : Copy" class="w-4 h-4 sm:hidden" />
              </Button>
            </div>
          </div>
          
          <!-- Filters -->
          <div class="flex flex-wrap gap-1.5 sm:gap-2 max-h-24 sm:max-h-32 overflow-y-auto p-2 sm:p-3 bg-secondary/20 border border-border/20 rounded-lg">
            <Badge
              v-for="filter in filters"
              :key="filter.type"
              @click="toggleFilter(filter.type)"
              :variant="activeFilters.includes(filter.type) ? 'default' : 'outline'"
              class="cursor-pointer transition-all hover:scale-105 min-h-[36px] sm:min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-medium touch-manipulation flex items-center"
              :class="{
                'bg-primary text-primary-foreground hover:bg-primary/90': activeFilters.includes(filter.type),
                'bg-background text-foreground border-border/40 hover:bg-muted': !activeFilters.includes(filter.type)
              }"
            >
              <component :is="getFilterIcon(filter.icon)" class="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              {{ filter.label }}
            </Badge>
            
            <!-- Clear Filters -->
            <Badge
              v-if="searchQuery || activeSearchQuery || activeFilters.length > 0"
              @click="clearSearch"
              variant="destructive"
              class="cursor-pointer transition-all hover:scale-105 min-h-[36px] sm:min-h-[40px] px-3 py-1.5 text-xs sm:text-sm font-medium touch-manipulation bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <X class="w-3 h-3 mr-1.5" />
              Clear All
            </Badge>
          </div>
          
          <!-- Results Count -->
          <div v-if="activeSearchQuery || activeFilters.length > 0" class="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1">
            <span>Showing {{ filteredChat.length }} of {{ chat.length }} messages</span>
            <span v-if="activeSearchQuery" class="font-medium">
              (searching for "{{ activeSearchQuery }}")
            </span>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col bg-background min-h-0">
        <ChatTranscript :chat="filteredChat" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { MessageSquare, Search, Copy, X, User, Bot, Settings, Wrench, CheckCircle, FileText, Edit3, Edit } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import ChatTranscript from './ChatTranscript.vue'

const props = defineProps<{
  isOpen: boolean
  chat: any[]
}>()

const emit = defineEmits<{
  close: []
}>()

const searchQuery = ref('')
const activeSearchQuery = ref('')
const activeFilters = ref<string[]>([])
const copyAllButtonText = ref('📋 Copy All')

const filters = [
  // Message types
  { type: 'user', label: 'User', icon: 'User' },
  { type: 'assistant', label: 'Assistant', icon: 'Bot' },
  { type: 'system', label: 'System', icon: 'Settings' },
  
  // Tool actions
  { type: 'tool_use', label: 'Tool Use', icon: 'Wrench' },
  { type: 'tool_result', label: 'Tool Result', icon: 'CheckCircle' },
  
  // Specific tools
  { type: 'Read', label: 'Read', icon: 'FileText' },
  { type: 'Write', label: 'Write', icon: 'Edit3' },
  { type: 'Edit', label: 'Edit', icon: 'Edit' },
  { type: 'Glob', label: 'Glob', icon: 'Search' },
]

const toggleFilter = (type: string) => {
  const index = activeFilters.value.indexOf(type)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(type)
  }
}

const executeSearch = () => {
  activeSearchQuery.value = searchQuery.value
}

const clearSearch = () => {
  searchQuery.value = ''
  activeSearchQuery.value = ''
  activeFilters.value = []
}

const close = () => {
  emit('close')
}

const handleDialogChange = (open: boolean) => {
  if (!open) {
    close()
  }
}

const getFilterIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'User': User,
    'Bot': Bot,
    'Settings': Settings,
    'Wrench': Wrench,
    'CheckCircle': CheckCircle,
    'FileText': FileText,
    'Edit3': Edit3,
    'Edit': Edit,
    'Search': Search
  }
  return iconMap[iconName] || Settings
}

const copyAllMessages = async () => {
  try {
    // Copy all chat messages as formatted JSON
    const jsonPayload = JSON.stringify(props.chat, null, 2)
    await navigator.clipboard.writeText(jsonPayload)
    
    copyAllButtonText.value = '✅ Copied!'
    setTimeout(() => {
      copyAllButtonText.value = '📋 Copy All'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy all messages:', err)
    copyAllButtonText.value = '❌ Failed'
    setTimeout(() => {
      copyAllButtonText.value = '📋 Copy All'
    }, 2000)
  }
}

const matchesSearch = (item: any, query: string): boolean => {
  const lowerQuery = query.toLowerCase().trim()
  
  // Check direct content (for system messages and simple chat)
  if (typeof item.content === 'string') {
    // Remove ANSI codes before searching
    const cleanContent = item.content.replace(/\u001b\[[0-9;]*m/g, '').toLowerCase()
    if (cleanContent.includes(lowerQuery)) {
      return true
    }
  }
  
  // Check role in simple format
  if (item.role && item.role.toLowerCase().includes(lowerQuery)) {
    return true
  }
  
  // Check message object (complex format)
  if (item.message) {
    // Check message role
    if (item.message.role && item.message.role.toLowerCase().includes(lowerQuery)) {
      return true
    }
    
    // Check message content
    if (item.message.content) {
      if (typeof item.message.content === 'string' && item.message.content.toLowerCase().includes(lowerQuery)) {
        return true
      }
      // Check array content
      if (Array.isArray(item.message.content)) {
        for (const content of item.message.content) {
          if (content.text && content.text.toLowerCase().includes(lowerQuery)) {
            return true
          }
          if (content.name && content.name.toLowerCase().includes(lowerQuery)) {
            return true
          }
          if (content.input && JSON.stringify(content.input).toLowerCase().includes(lowerQuery)) {
            return true
          }
          if (content.content && typeof content.content === 'string' && content.content.toLowerCase().includes(lowerQuery)) {
            return true
          }
        }
      }
    }
  }
  
  // Check type
  if (item.type && item.type.toLowerCase().includes(lowerQuery)) {
    return true
  }
  
  // Check parentUuid, uuid, sessionId
  if (item.uuid && item.uuid.toLowerCase().includes(lowerQuery)) {
    return true
  }
  if (item.sessionId && item.sessionId.toLowerCase().includes(lowerQuery)) {
    return true
  }
  
  // Check toolUseResult
  if (item.toolUseResult) {
    if (JSON.stringify(item.toolUseResult).toLowerCase().includes(lowerQuery)) {
      return true
    }
  }
  
  return false
}

const matchesFilters = (item: any): boolean => {
  if (activeFilters.value.length === 0) return true
  
  // Check message type
  if (item.type && activeFilters.value.includes(item.type)) {
    return true
  }
  
  // Check role (simple format)
  if (item.role && activeFilters.value.includes(item.role)) {
    return true
  }
  
  // Check for system messages with hook types
  if (item.type === 'system' && item.content) {
    // Extract hook type from system content (e.g., "PreToolUse:Read")
    const hookMatch = item.content.match(/([A-Za-z]+):/)?.[1]
    if (hookMatch && activeFilters.value.includes(hookMatch)) {
      return true
    }
    // Also check if content contains "Running"
    if (item.content.includes('Running') && activeFilters.value.includes('Running')) {
      return true
    }
    // Check for specific tool names in system messages
    const toolNames = ['Read', 'Write', 'Edit', 'Glob']
    for (const tool of toolNames) {
      if (item.content.includes(tool) && activeFilters.value.includes(tool)) {
        return true
      }
    }
  }
  
  // Check for command messages
  if (item.message?.content && typeof item.message.content === 'string') {
    if (item.message.content.includes('<command-') && activeFilters.value.includes('command')) {
      return true
    }
  }
  
  // Check for meta messages
  if (item.isMeta && activeFilters.value.includes('meta')) {
    return true
  }
  
  // Check for tool use in content
  if (item.message?.content && Array.isArray(item.message.content)) {
    for (const content of item.message.content) {
      if (content.type === 'tool_use') {
        if (activeFilters.value.includes('tool_use')) {
          return true
        }
        // Check for specific tool names
        if (content.name && activeFilters.value.includes(content.name)) {
          return true
        }
      }
      if (content.type === 'tool_result' && activeFilters.value.includes('tool_result')) {
        return true
      }
    }
  }
  
  return false
}

const filteredChat = computed(() => {
  if (!activeSearchQuery.value && activeFilters.value.length === 0) {
    return props.chat
  }
  
  return props.chat.filter(item => {
    const matchesQueryCondition = !activeSearchQuery.value || matchesSearch(item, activeSearchQuery.value)
    const matchesFilterCondition = matchesFilters(item)
    return matchesQueryCondition && matchesFilterCondition
  })
})

// Handle ESC key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Reset search when modal closes
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    clearSearch()
  }
})
</script>