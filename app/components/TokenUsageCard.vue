<template>
  <Card 
    class="p-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group"
    @click="$emit('openModal')"
    role="button"
    tabindex="0"
    @keydown.enter="$emit('openModal')"
    @keydown.space.prevent="$emit('openModal')"
  >
    <div v-if="!tokenData && loading" class="text-center py-6 text-muted-foreground">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
      <p class="text-sm">Loading...</p>
    </div>
    
    <div v-else-if="!tokenData" class="text-center py-6 text-muted-foreground">
      <Pause class="w-8 h-8 mx-auto mb-2" />
      <p class="text-sm">No Active Session</p>
      <p class="text-xs mt-1">Click to view details</p>
    </div>
    
    <div v-else class="space-y-3">
      <!-- Header with status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Zap class="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 class="font-semibold text-sm">Token Activity</h3>
            <p class="text-xs text-muted-foreground">{{ tokenData.isActive ? 'Active' : 'Completed' }}</p>
          </div>
        </div>
        
        <Badge :class="activityBadgeClass" variant="outline">
          {{ activityLevel }}
        </Badge>
      </div>
      
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Burn Rate -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold" :class="burnRateColorClass">{{ displayBurnRate }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Burn Rate</div>
        </div>
        
        <!-- Total Tokens -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold text-blue-600">{{ formatNumber(tokenData.totalTokens) }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Total Tokens</div>
        </div>
        
        <!-- Estimated Cost -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold text-green-600">${{ tokenData.costUSD.toFixed(3) }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Cost</div>
        </div>
        
        <!-- Tokens per Minute -->
        <div class="text-center p-2 bg-muted/30 rounded-lg">
          <div class="text-xl font-bold" :class="tokensPerMinColorClass">{{ displayTokensPerMin }}</div>
          <div class="text-[10px] text-muted-foreground uppercase tracking-wide">Tokens/min</div>
        </div>
      </div>
      
      <!-- Progress indicator for active sessions -->
      <div v-if="tokenData.isActive" class="space-y-1">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Session Progress</span>
          <span>{{ blockPercentage() }}%</span>
        </div>
        <div class="w-full bg-muted rounded-full h-1.5">
          <div 
            class="bg-primary h-1.5 rounded-full transition-all duration-500"
            :style="{ width: `${blockPercentage()}%` }"
          />
        </div>
      </div>
      
      <!-- Click hint -->
      <div class="text-center pt-1">
        <p class="text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Click for detailed analytics
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Zap, Loader2, Pause } from 'lucide-vue-next'
// Use centralized formatters
import { formatNumber, formatTime, formatDurationFromStart as formatDuration, formatDurationShort, formatLargeNumber } from '~/utils/formatters'
// Use shared token usage utilities
import { 
  transformSessionBlock, 
  getActivityLevel, 
  getActivityColorClass, 
  parseWebSocketMessage,
  calculateBlockPercentage,
  type TokenUsageData 
} from '~/utils/tokenUsage'
import { BLOCK_DURATION_MS } from '~/constants/tokenUsage'

// TokenUsageData interface now imported from shared utilities

const props = defineProps<{
  wsConnection?: WebSocket | null // WebSocket connection from parent
}>()

defineEmits<{
  openModal: []
}>()

const tokenData = ref<TokenUsageData | null>(null)
const loading = ref(true)
const updateInterval = ref<number | null>(null)

// transformSessionBlock function now imported from shared utilities


// formatModelName function now available in ~/utils/formatters

// Activity level based on burn rate
const activityLevel = computed(() => {
  return getActivityLevel(tokenData.value?.burnRate || 0)
})

// Activity badge styling
const activityBadgeClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'badge')
})

// Burn rate color
const burnRateColorClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'text')
})

// Display burn rate with appropriate formatting
const displayBurnRate = computed(() => {
  return formatLargeNumber(tokenData.value?.burnRate || 0)
})

// Display tokens per minute (same as burn rate since we're extracting tokensPerMinute)
const displayTokensPerMin = computed(() => {
  return formatLargeNumber(tokenData.value?.burnRate || 0)
})

// Tokens per minute color class  
const tokensPerMinColorClass = computed(() => {
  return getActivityColorClass(activityLevel.value, 'text')
})

// Calculate block percentage
const blockPercentage = (): number => {
  return calculateBlockPercentage(tokenData.value?.startTime, tokenData.value?.isActive || false)
}

// Fetch initial data
const fetchTokenData = async () => {
  const { apiUrl } = useServerConfig();
  try {
    const response = await fetch(apiUrl('/usage/blocks/live'))
    const result = await response.json()
    
    if (result.success && result.data) {
      tokenData.value = transformSessionBlock(result.data)
    } else {
      tokenData.value = null
    }
  } catch (error) {
    console.error('Error fetching token data:', error)
    tokenData.value = null
  } finally {
    loading.value = false
  }
}

// Handle WebSocket updates
const handleWebSocketMessage = (event: MessageEvent) => {
  const parsedData = parseWebSocketMessage(event)
  if (parsedData) {
    tokenData.value = parsedData
    loading.value = false
  }
}

onMounted(() => {
  // Initial fetch
  fetchTokenData()
  
  // Listen for WebSocket updates if available
  if (props.wsConnection) {
    props.wsConnection.addEventListener('message', handleWebSocketMessage)
  }
  
  // Update duration display every second for active sessions
  updateInterval.value = window.setInterval(() => {
    if (tokenData.value?.isActive) {
      // Force re-render to update duration
      tokenData.value = { ...tokenData.value }
    }
  }, 1000)
})

onUnmounted(() => {
  if (props.wsConnection) {
    props.wsConnection.removeEventListener('message', handleWebSocketMessage)
  }
  
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>