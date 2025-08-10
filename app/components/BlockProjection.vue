<template>
  <Card v-if="tokenData.isActive && projection" class="p-5 space-y-4 bg-gradient-to-br from-background to-muted/20">
    <h3 class="font-semibold flex items-center gap-2 text-base">
      <Calendar class="w-4 h-4" />
      5-Hour Block Projection
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
        <div class="text-lg font-bold">{{ formatLargeNumber(projection.tokens) }}</div>
        <div class="text-xs text-muted-foreground font-medium mt-1">Projected Tokens</div>
      </div>
      <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
        <div class="text-lg font-bold text-green-600">${{ projection.cost.toFixed(2) }}</div>
        <div class="text-xs text-muted-foreground font-medium mt-1">Projected Cost</div>
      </div>
      <div class="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border hover:shadow-sm transition-shadow">
        <div class="text-lg font-bold text-blue-600">{{ projection.timeRemaining }}</div>
        <div class="text-xs text-muted-foreground font-medium mt-1">Time Remaining</div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="space-y-3">
      <div class="flex justify-between text-sm font-medium">
        <span class="text-muted-foreground">Block Progress</span>
        <span class="text-primary">{{ blockPercentage }}%</span>
      </div>
      <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div 
          class="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-700 ease-out relative"
          :style="{ width: `${blockPercentage}%` }"
        >
          <div class="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
        </div>
      </div>
      <div class="text-xs text-muted-foreground text-center opacity-75">
        {{ Math.floor((BLOCK_DURATION_MS / 1000 / 60 * blockPercentage) / 100) }} minutes elapsed of {{ BLOCK_DURATION_MS / 1000 / 60 }} minute block
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '~/components/ui/card'
import { Calendar } from 'lucide-vue-next'
// Use shared utilities and constants
import { formatLargeNumber } from '~/utils/formatters'
import { calculateBlockPercentage, type TokenUsageData } from '~/utils/tokenUsage'
import { BLOCK_DURATION_MS } from '~/constants/tokenUsage'

const props = defineProps<{
  tokenData: TokenUsageData
  projection?: any | null
}>()

// Calculate block percentage using shared utility
const blockPercentage = computed(() => {
  return calculateBlockPercentage(props.tokenData.startTime, props.tokenData.isActive)
})
</script>