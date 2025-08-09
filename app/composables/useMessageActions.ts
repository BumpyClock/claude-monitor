import { formatTimestamp } from '~/utils/formatters';

const MAX_TRUNCATE_LENGTH = 500;
const DEFAULT_TRUNCATE_LINES = 10;

export interface MessageActionsOptions {
  maxLines?: number;
  maxCharacters?: number;
}

export function useMessageActions(options: MessageActionsOptions = {}) {
  const { maxLines = DEFAULT_TRUNCATE_LINES, maxCharacters = MAX_TRUNCATE_LENGTH } = options;

  // Track expanded state for content and details
  const expandedContent = ref<Set<string>>(new Set());
  const expandedDetails = ref<Set<string>>(new Set());
  
  // Track copy button states
  const copyButtonStates = ref<Map<string, 'success' | 'error'>>(new Map());

  // Toggle content expansion
  const toggleContent = (id: string) => {
    if (expandedContent.value.has(id)) {
      expandedContent.value.delete(id);
    } else {
      expandedContent.value.add(id);
    }
    // Force reactivity
    expandedContent.value = new Set(expandedContent.value);
  };

  // Toggle details expansion
  const toggleDetails = (id: string) => {
    if (expandedDetails.value.has(id)) {
      expandedDetails.value.delete(id);
    } else {
      expandedDetails.value.add(id);
    }
    // Force reactivity
    expandedDetails.value = new Set(expandedDetails.value);
  };

  // Check if content is expanded
  const isContentExpanded = (id: string) => expandedContent.value.has(id);
  
  // Check if details are expanded  
  const isDetailsExpanded = (id: string) => expandedDetails.value.has(id);

  // Truncate text content
  const truncateContent = (content: string, forceExpanded: boolean = false) => {
    if (forceExpanded) return content;
    
    const lines = content.split('\n');
    
    // If content is short enough, return as-is
    if (lines.length <= maxLines && content.length <= maxCharacters) {
      return { text: content, isTruncated: false };
    }
    
    // Truncate by lines first
    let truncated = lines.slice(0, maxLines).join('\n');
    
    // Further truncate by characters if needed
    if (truncated.length > maxCharacters) {
      truncated = truncated.slice(0, maxCharacters);
      // Try to break at word boundary
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxCharacters * 0.8) {
        truncated = truncated.slice(0, lastSpace);
      }
    }
    
    return { text: truncated + '...', isTruncated: true };
  };

  // Copy message to clipboard
  const copyMessage = async (id: string, content: any) => {
    if (!process.client) return false;

    try {
      const jsonPayload = typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2);
      
      await navigator.clipboard.writeText(jsonPayload);
      
      copyButtonStates.value.set(id, 'success');
      setTimeout(() => {
        copyButtonStates.value.delete(id);
        copyButtonStates.value = new Map(copyButtonStates.value);
      }, 2000);
      
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      copyButtonStates.value.set(id, 'error');
      setTimeout(() => {
        copyButtonStates.value.delete(id);
        copyButtonStates.value = new Map(copyButtonStates.value);
      }, 2000);
      
      return false;
    }
  };

  // Get copy button state
  const getCopyState = (id: string) => copyButtonStates.value.get(id);

  // Clean system content (remove ANSI codes)
  const cleanSystemContent = (content: string) => {
    return content.replace(/\u001b\[[0-9;]*m/g, '');
  };

  // Clean command content (remove command tags)
  const cleanCommandContent = (content: string) => {
    return content
      .replace(/<command-message>.*?<\/command-message>/gs, '')
      .replace(/<command-name>(.*?)<\/command-name>/gs, '$1')
      .trim();
  };

  // Check if content needs truncation
  const needsTruncation = (content: string) => {
    const lines = content.split('\n');
    return lines.length > maxLines || content.length > maxCharacters;
  };

  return {
    expandedContent,
    expandedDetails,
    copyButtonStates,
    toggleContent,
    toggleDetails,
    isContentExpanded,
    isDetailsExpanded,
    truncateContent,
    copyMessage,
    getCopyState,
    cleanSystemContent,
    cleanCommandContent,
    formatTimestamp,
    needsTruncation
  };
}