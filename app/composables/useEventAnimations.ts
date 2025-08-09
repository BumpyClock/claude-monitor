export type AnimationType = 'enter' | 'exit' | 'update' | 'pulse' | 'highlight'

export interface AnimationState {
  type: AnimationType
  isActive: boolean
  timestamp: number
}

export function useEventAnimations() {
  // Track animation states by event/group ID
  const animationStates = reactive<Map<string, AnimationState>>(new Map())
  
  // Track which events are truly new (for fade-in only)
  const seenEventIds = ref<Set<string>>(new Set())
  
  // Trigger an animation for a specific event
  const triggerAnimation = (eventId: string, type: AnimationType, duration = 1000) => {
    const state: AnimationState = {
      type,
      isActive: true,
      timestamp: Date.now()
    }
    
    animationStates.set(eventId, state)
    
    // Auto-clear animation after duration
    setTimeout(() => {
      const currentState = animationStates.get(eventId)
      if (currentState && currentState.timestamp === state.timestamp) {
        currentState.isActive = false
      }
    }, duration)
  }
  
  // Get animation state for an event
  const getAnimationState = (eventId: string): AnimationState | null => {
    return animationStates.get(eventId) || null
  }
  
  // Check if event should get enter animation (truly new)
  const shouldAnimate = (eventId: string, changeType: 'new' | 'updated' | 'unchanged'): AnimationType | null => {
    switch (changeType) {
      case 'new':
        if (!seenEventIds.value.has(eventId)) {
          seenEventIds.value.add(eventId)
          return 'enter'
        }
        return null
        
      case 'updated':
        return 'update'
        
      case 'unchanged':
      default:
        return null
    }
  }
  
  // Apply animation to an event automatically
  const processEventAnimation = async (eventId: string, changeType: 'new' | 'updated' | 'unchanged') => {
    const animationType = shouldAnimate(eventId, changeType)
    
    if (animationType) {
      await nextTick() // Wait for DOM update
      triggerAnimation(eventId, animationType)
    }
  }
  
  // Pulse animation for updated cards
  const pulseCard = (eventId: string) => {
    triggerAnimation(eventId, 'pulse', 600)
  }
  
  // Highlight animation for count changes
  const highlightChange = (eventId: string) => {
    triggerAnimation(eventId, 'highlight', 800)
  }
  
  // Clean up old animation states
  const cleanup = () => {
    const now = Date.now()
    for (const [eventId, state] of animationStates.entries()) {
      if (!state.isActive && now - state.timestamp > 5000) {
        animationStates.delete(eventId)
      }
    }
  }
  
  // Check if animation is currently active
  const isAnimating = (eventId: string, type?: AnimationType): boolean => {
    const state = animationStates.get(eventId)
    if (!state || !state.isActive) return false
    
    if (type) {
      return state.type === type
    }
    
    return true
  }
  
  // Get CSS classes for animations
  const getAnimationClasses = (eventId: string): string[] => {
    const state = animationStates.get(eventId)
    if (!state || !state.isActive) return []
    
    switch (state.type) {
      case 'enter':
        return ['animate-fade-in', 'animate-slide-up']
      case 'exit':
        return ['animate-fade-out', 'animate-slide-down']
      case 'update':
        return ['animate-pulse-gentle']
      case 'pulse':
        return ['animate-pulse-brief']
      case 'highlight':
        return ['animate-highlight']
      default:
        return []
    }
  }
  
  // Periodically cleanup old states
  let cleanupInterval: NodeJS.Timeout | null = null
  
  if (process.client) {
    cleanupInterval = setInterval(cleanup, 10000)
  }
  
  const destroy = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
    animationStates.clear()
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    destroy()
  })
  
  return {
    triggerAnimation,
    getAnimationState,
    processEventAnimation,
    pulseCard,
    highlightChange,
    isAnimating,
    getAnimationClasses,
    cleanup,
    destroy
  }
}