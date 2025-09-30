import { loadTutorialContent, CodeSnippet, StoryStep } from './utils/contentLoader'

export type CodeKey = 'connect_wallet' | 'encrypt_input' | 'compute' | 'decrypt_output' | 'contract'

// Legacy type for backward compatibility
type Snippet = CodeSnippet

// Global state for loaded content
let currentTutorial: string = 'survey-tutorial'
let loadedContent: { story: StoryStep[], codeSnippets: Record<string, CodeSnippet> } | null = null
let loadingPromise: Promise<void> | null = null

// Load content asynchronously
async function loadContent() {
  if (loadingPromise) return loadingPromise
  
  loadingPromise = loadTutorialContent(currentTutorial).then(content => {
    loadedContent = content
  }).catch(error => {
    console.error('Failed to load tutorial content:', error)
    // Fallback to minimal content
    loadedContent = {
      story: [],
      codeSnippets: {}
    }
  })
  
  return loadingPromise
}

// Get code snippet by key
export function getCodeSnippet(key: CodeKey): CodeSnippet {
  if (!loadedContent) {
    return {
      title: 'Loading...',
      language: 'typescript',
      code: '// Content loading...'
    }
  }
  
  return loadedContent.codeSnippets[key] || {
    title: 'Not Found',
    language: 'typescript',
    code: '// Content not found'
  }
}

// Get story steps
export function getStorySteps(): StoryStep[] {
  if (!loadedContent) return []
  return loadedContent.story
}

// Switch tutorial
export async function switchTutorial(tutorialName: string) {
  currentTutorial = tutorialName
  loadedContent = null
  loadingPromise = null
  await loadContent()
}

// Initialize content loading
export function initializeContent() {
  return loadContent()
}

// Legacy export for backward compatibility
export const codeMap: Record<CodeKey, Snippet> = new Proxy({} as Record<CodeKey, Snippet>, {
  get(target, prop: string | symbol) {
    if (typeof prop === 'string') {
      return getCodeSnippet(prop as CodeKey)
    }
    return undefined
  }
})
