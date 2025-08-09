<template>
  <div class="bg-background rounded-lg p-2 sm:p-4 h-full overflow-y-auto space-y-2 sm:space-y-4 border border-border/20 mobile-no-scroll" style="-webkit-overflow-scrolling: touch;">
    <div v-for="(item, index) in chatItems" :key="index">
      <!-- User Message -->
      <Card v-if="item.type === 'user' && item.message" 
           class="p-3 sm:p-4 bg-primary/5 border-primary/20 touch-manipulation">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1">
            <Badge class="text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground shrink-0">
              <User class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span class="hidden xs:inline">User</span>
              <span class="xs:hidden">U</span>
            </Badge>
            <div class="flex-1">
              <!-- Handle string content -->
              <p v-if="typeof item.message.content === 'string'" 
                 class="text-base text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                {{ item.message.content.includes('<command-') ? cleanCommandContent(item.message.content) : item.message.content }}
              </p>
              <!-- Handle array content -->
              <div v-else-if="Array.isArray(item.message.content)" class="space-y-3">
                <div v-for="(content, cIndex) in item.message.content" :key="cIndex">
                  <!-- Text content -->
                  <p v-if="content.type === 'text'" 
                     class="text-base text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                    {{ content.text }}
                  </p>
                  <!-- Tool result -->
                  <div v-else-if="content.type === 'tool_result'" 
                       class="bg-muted p-3 rounded-md border border-border">
                    <Badge variant="outline" size="xs" class="mb-2">
                      <Wrench class="w-3 h-3 mr-1" />
                      Tool Result
                    </Badge>
                    <pre class="text-sm text-foreground mt-1 overflow-x-auto">{{ content.content }}</pre>
                  </div>
                </div>
              </div>
              <!-- Metadata -->
              <div v-if="item.timestamp" class="mt-2 text-xs text-muted-foreground">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <Button
              @click="toggleDetails(index)"
              variant="ghost"
              size="xs"
              class="text-xs"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </Button>
            <Button
              @click="copyMessage(index)"
              variant="ghost" 
              size="xs"
              class="text-xs"
              :title="'Copy message'"
            >
              {{ getCopyButtonText(index) }}
            </Button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-muted rounded-lg border border-border">
          <pre class="text-xs text-muted-foreground overflow-x-auto">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </Card>

      <!-- Assistant Message -->
      <Card v-else-if="item.type === 'assistant' && item.message" 
           class="p-4 bg-secondary/5 border-secondary/20">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1">
            <Badge class="text-sm font-semibold px-3 py-1.5 bg-secondary text-secondary-foreground">
              <Bot class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Assistant
            </Badge>
            <div class="flex-1">
              <!-- Handle content array -->
              <div v-if="Array.isArray(item.message.content)" class="space-y-3">
                <div v-for="(content, cIndex) in item.message.content" :key="cIndex">
                  <!-- Text content -->
                  <p v-if="content.type === 'text'" 
                     class="text-base text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                    {{ content.text }}
                  </p>
                  <!-- Tool use -->
                  <div v-else-if="content.type === 'tool_use'" 
                       class="bg-warning/5 p-3 rounded-md border border-warning/20">
                    <div class="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" class="bg-warning/10 text-warning-foreground border-warning/30">
                        <Wrench class="w-3 h-3 mr-1" />
                        {{ content.name }}
                      </Badge>
                    </div>
                    <pre class="text-sm text-foreground overflow-x-auto bg-muted p-2 rounded">{{ JSON.stringify(content.input, null, 2) }}</pre>
                  </div>
                </div>
              </div>
              <!-- Usage info -->
              <div v-if="item.message.usage" class="mt-2">
                <Badge variant="outline" size="xs" class="text-xs text-muted-foreground">
                  <BarChart3 class="w-3 h-3 mr-1" />
                  Tokens: {{ item.message.usage.input_tokens }} in / {{ item.message.usage.output_tokens }} out
                </Badge>
              </div>
              <!-- Timestamp -->
              <div v-if="item.timestamp" class="mt-1 text-xs text-muted-foreground">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <Button
              @click="toggleDetails(index)"
              variant="ghost"
              size="xs"
              class="text-xs"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </Button>
            <Button
              @click="copyMessage(index)"
              variant="ghost" 
              size="xs"
              class="text-xs"
              :title="'Copy message'"
            >
              {{ getCopyButtonText(index) }}
            </Button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-muted rounded-lg border border-border">
          <pre class="text-xs text-muted-foreground overflow-x-auto">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </Card>

      <!-- System Message -->
      <Card v-else-if="item.type === 'system'" 
           class="p-4 bg-warning/5 border-warning/20">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1">
            <Badge class="text-sm font-semibold px-3 py-1.5 bg-warning text-warning-foreground">
              <Settings class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              System
            </Badge>
            <div class="flex-1">
              <p class="text-base text-foreground font-medium leading-relaxed">
                {{ cleanSystemContent(item.content || '') }}
              </p>
              <!-- Tool use ID if present -->
              <div v-if="item.toolUseID" class="mt-1">
                <Badge variant="outline" size="xs" class="font-mono">
                  ID: {{ item.toolUseID }}
                </Badge>
              </div>
              <!-- Timestamp -->
              <div v-if="item.timestamp" class="mt-1 text-xs text-muted-foreground">
                {{ formatTimestamp(item.timestamp) }}
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <Button
              @click="toggleDetails(index)"
              variant="ghost"
              size="xs"
              class="text-xs"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </Button>
            <Button
              @click="copyMessage(index)"
              variant="ghost" 
              size="xs"
              class="text-xs"
              :title="'Copy message'"
            >
              {{ getCopyButtonText(index) }}
            </Button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-muted rounded-lg border border-border">
          <pre class="text-xs text-muted-foreground overflow-x-auto">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </Card>

      <!-- Fallback for simple chat format -->
      <Card v-else-if="item.role" 
           class="p-4"
           :class="item.role === 'user' ? 'bg-primary/5 border-primary/20' : 'bg-secondary/5 border-secondary/20'">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1">
            <Badge class="text-sm font-semibold px-3 py-1.5"
                  :class="item.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'">
              <component :is="item.role === 'user' ? User : Bot" class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {{ item.role === 'user' ? 'User' : 'Assistant' }}
            </Badge>
            <div class="flex-1">
              <p class="text-base text-foreground whitespace-pre-wrap font-medium leading-relaxed">
                {{ item.content }}
              </p>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 ml-2">
            <Button
              @click="toggleDetails(index)"
              variant="ghost"
              size="xs"
              class="text-xs"
            >
              {{ isDetailsExpanded(index) ? 'Hide' : 'Show' }} Details
            </Button>
            <Button
              @click="copyMessage(index)"
              variant="ghost" 
              size="xs"
              class="text-xs"
              :title="'Copy message'"
            >
              {{ getCopyButtonText(index) }}
            </Button>
          </div>
        </div>
        <!-- Details Section -->
        <div v-if="isDetailsExpanded(index)" class="mt-3 p-3 bg-muted rounded-lg border border-border">
          <pre class="text-xs text-muted-foreground overflow-x-auto">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { User, Bot, Settings, Wrench, CheckCircle, Copy, ChevronDown, ChevronUp, BarChart3 } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  chat: any[]
}>()

// Track which items have details expanded
const expandedDetails = ref<Set<number>>(new Set())

const toggleDetails = (index: number) => {
  if (expandedDetails.value.has(index)) {
    expandedDetails.value.delete(index)
  } else {
    expandedDetails.value.add(index)
  }
  // Force reactivity
  expandedDetails.value = new Set(expandedDetails.value)
}

const isDetailsExpanded = (index: number) => {
  return expandedDetails.value.has(index)
}

const chatItems = computed(() => {
  // Handle both simple chat format and complex claude-code format
  if (props.chat.length > 0 && props.chat[0].type) {
    // Complex format from chat.json
    return props.chat
  } else {
    // Simple format with role/content
    return props.chat
  }
})

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

const cleanSystemContent = (content: string) => {
  // Remove ANSI escape codes
  return content.replace(/\u001b\[[0-9;]*m/g, '')
}

const cleanCommandContent = (content: string) => {
  // Remove command tags and clean content
  return content
    .replace(/<command-message>.*?<\/command-message>/gs, '')
    .replace(/<command-name>(.*?)<\/command-name>/gs, '$1')
    .trim()
}

// Track copy button states
const copyButtonStates = ref<Map<number, string>>(new Map())

const getCopyButtonText = (index: number) => {
  const state = copyButtonStates.value.get(index)
  if (state === 'success') return 'Copied!'
  if (state === 'error') return 'Failed'
  return 'Copy'
}

const copyMessage = async (index: number) => {
  const item = chatItems.value[index]
  
  try {
    // Copy the entire JSON payload
    const jsonPayload = JSON.stringify(item, null, 2)
    await navigator.clipboard.writeText(jsonPayload)
    
    copyButtonStates.value.set(index, 'success')
    setTimeout(() => {
      copyButtonStates.value.delete(index)
      copyButtonStates.value = new Map(copyButtonStates.value)
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    copyButtonStates.value.set(index, 'error')
    setTimeout(() => {
      copyButtonStates.value.delete(index)
      copyButtonStates.value = new Map(copyButtonStates.value)
    }, 2000)
  }
  // Force reactivity
  copyButtonStates.value = new Map(copyButtonStates.value)
}
</script>

<style scoped>
/* Mobile-specific optimizations */
@media (max-width: 768px) {
  /* Improve text wrapping and readability on mobile */
  :deep(.break-words) {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
  }
  
  /* Optimize pre elements for mobile */
  :deep(pre) {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  /* Ensure buttons are touch-friendly */
  :deep(.touch-manipulation) {
    touch-action: manipulation;
  }
  
  /* Better card spacing on mobile */
  :deep(.space-y-2 > * + *) {
    margin-top: 0.5rem;
  }
}

/* Enhanced mobile scrolling */
.mobile-no-scroll::-webkit-scrollbar {
  display: none;
}

.mobile-no-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Improve button interactions */
:deep(button) {
  min-height: 44px;
  min-width: 44px;
}

@media (min-width: 640px) {
  :deep(button) {
    min-height: auto;
    min-width: auto;
  }
}
</style>