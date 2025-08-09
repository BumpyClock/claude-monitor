<template>
  <div 
    class="p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="messageClass"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start space-x-3 flex-1">
        <!-- Badge/Label -->
        <span 
          class="text-sm font-bold px-3 py-1.5 rounded-lg flex-shrink-0 shadow-md"
          :class="badgeClass"
        >
          <component :is="icon" class="h-4 w-4 inline mr-1" />
          {{ label }}
        </span>
        
        <!-- Content Area -->
        <div class="flex-1">
          <!-- Main Content -->
          <div class="text-base font-medium">
            <!-- String content -->
            <template v-if="typeof content === 'string'">
              <p v-if="!needsTruncation || isExpanded" class="whitespace-pre-wrap break-words">
                {{ processedContent }}
              </p>
              <div v-else>
                <p class="whitespace-pre-wrap break-words">{{ typeof truncatedContent === 'string' ? truncatedContent : truncatedContent.text }}</p>
                <Button
                  @click.stop="toggleContentExpansion"
                  variant="ghost"
                  size="xs"
                  class="mt-1 text-xs"
                >
                  Show more
                </Button>
              </div>
            </template>
            
            <!-- Complex content (array) -->
            <div v-else-if="Array.isArray(content)" class="space-y-2">
              <slot name="complex-content" :content="content" :expanded="isExpanded">
                <!-- Default complex content rendering -->
                <div v-for="(item, idx) in (isExpanded ? content : content.slice(0, 2))" :key="idx">
                  <slot name="content-item" :item="item" :index="idx">
                    <p v-if="item.type === 'text'" class="whitespace-pre-wrap break-words">
                      {{ item.text }}
                    </p>
                    <div v-else class="bg-muted/50 p-3 rounded-lg border">
                      <pre class="text-sm text-muted-foreground font-mono whitespace-pre">{{ JSON.stringify(item, null, 2) }}</pre>
                    </div>
                  </slot>
                </div>
                <Button
                  v-if="content.length > 2 && !isExpanded"
                  @click.stop="toggleContentExpansion"
                  variant="ghost"
                  size="xs"
                  class="text-xs"
                >
                  Show {{ content.length - 2 }} more items
                </Button>
              </slot>
            </div>
          </div>
          
          <!-- Metadata -->
          <slot name="metadata">
            <div v-if="timestamp" class="mt-2 text-xs text-muted-foreground">
              <Clock class="h-3 w-3 inline mr-1" />
              {{ formattedTimestamp }}
            </div>
          </slot>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center space-x-1 ml-2">
        <!-- Show/Hide Content Button (only if content is truncatable) -->
        <Button
          v-if="needsTruncation"
          @click.stop="toggleContentExpansion"
          variant="ghost"
          size="xs"
          class="flex items-center gap-1"
        >
          <component :is="isExpanded ? ChevronUp : ChevronDown" class="h-3 w-3" />
          {{ isExpanded ? 'Less' : 'More' }}
        </Button>
        
        <!-- Show Details Button -->
        <Button
          @click.stop="toggleDetailsExpansion"
          variant="ghost"
          size="xs"
          class="flex items-center gap-1"
        >
          <component :is="showDetails ? ChevronUp : ChevronDown" class="h-3 w-3" />
          {{ showDetails ? 'Hide' : 'Details' }}
        </Button>
        
        <!-- Copy Button -->
        <Button
          @click.stop="handleCopy"
          variant="ghost"
          size="xs"
          :title="'Copy message'"
        >
          <component :is="copyIcon" class="h-3.5 w-3.5" :class="copyIconClass" />
        </Button>
      </div>
    </div>
    
    <!-- Details Section -->
    <Transition name="expand">
      <div v-if="showDetails" class="mt-3 p-3 bg-muted/30 rounded-lg border overflow-hidden">
        <div class="overflow-x-auto max-w-full">
          <pre class="text-xs text-muted-foreground font-mono whitespace-pre">{{ JSON.stringify(rawMessage, null, 2) }}</pre>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.expand-enter-from {
  opacity: 0;
  transform: scaleY(0.9) translateY(-10px);
}

.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-10px);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, Copy, Check, X, Clock } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

interface Props {
  id: string
  type: 'user' | 'assistant' | 'system'
  label: string
  icon: any
  content: string | any[]
  rawMessage: any
  timestamp?: string | number
  messageClass?: string
  badgeClass?: string
  maxLines?: number
  maxCharacters?: number
}

const props = defineProps<Props>()

// State for expanded/collapsed content
const expandedContent = ref<Set<string>>(new Set())
const expandedDetails = ref<Set<string>>(new Set())
const copyStates = ref<Map<string, 'success' | 'error' | null>>(new Map())

// Constants
const MAX_TRUNCATE_LENGTH = 500
const DEFAULT_TRUNCATE_LINES = 3

// Computed properties
const isExpanded = computed(() => expandedContent.value.has(props.id))
const showDetails = computed(() => expandedDetails.value.has(props.id))

const processedContent = computed(() => {
  if (typeof props.content !== 'string') return props.content
  
  let processed = props.content
  
  // Clean system messages
  if (props.type === 'system') {
    processed = cleanSystemContent(processed)
  }
  
  // Clean command messages
  if (processed.includes('<command-')) {
    processed = cleanCommandContent(processed)
  }
  
  return processed
})

const needsTruncation = computed(() => {
  if (typeof props.content !== 'string') {
    return Array.isArray(props.content) && props.content.length > 2
  }
  return checkNeedsTruncation(processedContent.value as string)
})

const truncatedContent = computed(() => {
  if (typeof props.content !== 'string') return { text: '', isTruncated: false }
  return truncateContent(processedContent.value as string, isExpanded.value)
})

const formattedTimestamp = computed(() => {
  return props.timestamp ? formatTimestamp(props.timestamp) : ''
})

const copyState = computed(() => copyStates.value.get(props.id))
const copyIcon = computed(() => {
  if (copyState.value === 'success') return Check
  if (copyState.value === 'error') return X
  return Copy
})

const copyIconClass = computed(() => {
  if (copyState.value === 'success') return 'text-green-500'
  if (copyState.value === 'error') return 'text-red-500'
  return ''
})

// Methods
const toggleContentExpansion = () => {
  if (expandedContent.value.has(props.id)) {
    expandedContent.value.delete(props.id)
  } else {
    expandedContent.value.add(props.id)
  }
  expandedContent.value = new Set(expandedContent.value)
}

const toggleDetailsExpansion = () => {
  if (expandedDetails.value.has(props.id)) {
    expandedDetails.value.delete(props.id)
  } else {
    expandedDetails.value.add(props.id)
  }
  expandedDetails.value = new Set(expandedDetails.value)
}

const handleCopy = async () => {
  try {
    const jsonPayload = JSON.stringify(props.rawMessage, null, 2)
    await navigator.clipboard.writeText(jsonPayload)
    
    copyStates.value.set(props.id, 'success')
    setTimeout(() => {
      copyStates.value.delete(props.id)
      copyStates.value = new Map(copyStates.value)
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    copyStates.value.set(props.id, 'error')
    setTimeout(() => {
      copyStates.value.delete(props.id)
      copyStates.value = new Map(copyStates.value)
    }, 2000)
  }
  copyStates.value = new Map(copyStates.value)
}

// Helper functions
const cleanSystemContent = (content: string): string => {
  return content.replace(/\u001b\[[0-9;]*m/g, '')
}

const cleanCommandContent = (content: string): string => {
  return content
    .replace(/<command-message>.*?<\/command-message>/gs, '')
    .replace(/<command-name>(.*?)<\/command-name>/gs, '$1')
    .trim()
}

const formatTimestamp = (timestamp: string | number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const checkNeedsTruncation = (text: string): boolean => {
  const maxChars = props.maxCharacters || MAX_TRUNCATE_LENGTH
  const maxLines = props.maxLines || DEFAULT_TRUNCATE_LINES
  
  if (text.length > maxChars) return true
  
  const lines = text.split('\n')
  return lines.length > maxLines
}

const truncateContent = (text: string, expanded: boolean) => {
  if (expanded) return { text, isTruncated: false }
  
  const maxChars = props.maxCharacters || MAX_TRUNCATE_LENGTH
  const maxLines = props.maxLines || DEFAULT_TRUNCATE_LINES
  
  let truncated = text
  let isTruncated = false
  
  // Truncate by character count
  if (truncated.length > maxChars) {
    truncated = truncated.slice(0, maxChars) + '...'
    isTruncated = true
  }
  
  // Truncate by line count
  const lines = truncated.split('\n')
  if (lines.length > maxLines) {
    truncated = lines.slice(0, maxLines).join('\n') + '...'
    isTruncated = true
  }
  
  return { text: truncated, isTruncated }
}
</script>