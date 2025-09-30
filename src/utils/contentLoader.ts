import { marked } from 'marked'

export interface CodeSnippet {
  title: string
  language: string
  code: string
  highlight?: [number, number]
}

export interface StoryStep {
  key: string
  title: string
  copy: string
  subsections?: {
    key: string
    title: string
    copy: string
  }[]
}

export interface TutorialContent {
  story: StoryStep[]
  codeSnippets: Record<string, CodeSnippet>
}

// Parse markdown content and extract code blocks
export function parseMarkdownContent(content: string): CodeSnippet {
  const lines = content.split('\n')
  
  // Extract title (first h1)
  const titleMatch = lines.find(line => line.startsWith('# '))
  const title = titleMatch ? titleMatch.replace('# ', '') : 'Code Example'
  
  // Extract code block
  let inCodeBlock = false
  let language = 'typescript'
  let codeLines: string[] = []
  
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        language = line.replace('```', '') || 'typescript'
      } else {
        break
      }
    } else if (inCodeBlock) {
      codeLines.push(line)
    }
  }
  
  // Extract highlight info
  const highlightMatch = lines.find(line => line.startsWith('## Highlight Lines'))
  let highlight: [number, number] | undefined
  if (highlightMatch) {
    const nextLine = lines[lines.indexOf(highlightMatch) + 1]
    if (nextLine && nextLine.includes('-')) {
      const [start, end] = nextLine.split('-').map(n => parseInt(n.trim()))
      if (!isNaN(start) && !isNaN(end)) {
        highlight = [start, end]
      }
    }
  }
  
  return {
    title,
    language,
    code: codeLines.join('\n'),
    highlight
  }
}

// Load tutorial content from a specific tutorial directory
export async function loadTutorialContent(tutorialName: string): Promise<TutorialContent> {
  const basePath = `/content/${tutorialName}`
  
  // Load story configuration
  const storyResponse = await fetch(`${basePath}/story.json`)
  const story: StoryStep[] = await storyResponse.json()
  
  // Load code snippets
  const codeSnippets: Record<string, CodeSnippet> = {}
  
  for (const step of story) {
    try {
      const response = await fetch(`${basePath}/${step.key}.md`)
      const content = await response.text()
      codeSnippets[step.key] = parseMarkdownContent(content)
    } catch (error) {
      console.warn(`Failed to load content for ${step.key}:`, error)
      // Fallback to empty content
      codeSnippets[step.key] = {
        title: 'Loading...',
        language: 'typescript',
        code: '// Content loading...'
      }
    }
    
    // Load subsection content if it exists
    if (step.subsections) {
      for (const subsection of step.subsections) {
        try {
          const response = await fetch(`${basePath}/${subsection.key}.md`)
          const content = await response.text()
          codeSnippets[subsection.key] = parseMarkdownContent(content)
        } catch (error) {
          console.warn(`Failed to load subsection content for ${subsection.key}:`, error)
          // Fallback to empty content
          codeSnippets[subsection.key] = {
            title: 'Loading...',
            language: 'typescript',
            code: '// Content loading...'
          }
        }
      }
    }
  }
  
  // Load additional snippets that might not be in story (like 'contract')
  const additionalSnippets = ['contract']
  for (const snippetKey of additionalSnippets) {
    try {
      const response = await fetch(`${basePath}/${snippetKey}.md`)
      const content = await response.text()
      codeSnippets[snippetKey] = parseMarkdownContent(content)
    } catch (error) {
      // Snippet doesn't exist, skip it
    }
  }
  
  return { story, codeSnippets }
}