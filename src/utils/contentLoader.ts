import { marked } from 'marked'

// Preprocess content to convert GitBook-style hints to HTML
function preprocessGitBookHints(content: string): string {
  // Replace {% hint style="info|warning|danger|success" %} ... {% endhint %}
  const hintRegex = /\{%\s*hint\s+style="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g

  return content.replace(hintRegex, (match, style, hintContent) => {
    const cleanContent = hintContent.trim()
    return `<div class="hint hint-${style}">\n\n${cleanContent}\n\n</div>`
  })
}

// Add scroll anchor IDs to section headers
function addScrollAnchors(html: string): string {
  // Add IDs to h2 headers for scrolling
  return html.replace(/<h2>(.*?)<\/h2>/g, (match, title) => {
    // Create ID from title (e.g., "Step 1: Create File" -> "step-1-create-file")
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h2 id="${id}">${title}</h2>`
  })
}

// Configure marked for better code highlighting
marked.setOptions({
  gfm: true,
  breaks: true,
})

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
  codeKey?: string  // The code snippet to display
  highlight?: [number, number]  // Line range to highlight
  fullContent?: string  // The full markdown content rendered as HTML
  scrollAnchor?: string  // ID to scroll to in the content
  subsections?: {
    key: string
    title: string
    copy: string
    codeKey?: string
    highlight?: [number, number]
    fullContent?: string
    scrollAnchor?: string  // ID to scroll to in the content
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

  // Find the best code block to show
  // Priority: 1) After "## Highlight Lines" marker, 2) Largest code block, 3) First code block
  let allCodeBlocks: { language: string; code: string; startIndex: number }[] = []
  let inCodeBlock = false
  let currentLanguage = 'typescript'
  let currentCodeLines: string[] = []
  let currentStartIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        currentLanguage = line.replace('```', '').trim() || 'typescript'
        currentCodeLines = []
        currentStartIndex = i
      } else {
        // End of code block
        inCodeBlock = false
        allCodeBlocks.push({
          language: currentLanguage,
          code: currentCodeLines.join('\n'),
          startIndex: currentStartIndex
        })
      }
    } else if (inCodeBlock) {
      currentCodeLines.push(line)
    }
  }

  // Extract highlight info
  const highlightMatch = lines.find(line => line.startsWith('## Highlight Lines'))
  let highlight: [number, number] | undefined
  let selectedCodeBlock = allCodeBlocks[0] // Default to first block

  if (highlightMatch) {
    const highlightIndex = lines.indexOf(highlightMatch)
    const nextLine = lines[highlightIndex + 1]

    // Parse highlight range
    if (nextLine) {
      const trimmed = nextLine.trim()
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()))
        if (!isNaN(start) && !isNaN(end)) {
          highlight = [start, end]
        }
      } else {
        // Single line highlight
        const lineNum = parseInt(trimmed)
        if (!isNaN(lineNum)) {
          highlight = [lineNum, lineNum]
        }
      }
    }

    // Find the code block closest BEFORE the highlight marker
    for (let i = allCodeBlocks.length - 1; i >= 0; i--) {
      if (allCodeBlocks[i].startIndex < highlightIndex) {
        selectedCodeBlock = allCodeBlocks[i]
        break
      }
    }
  } else if (allCodeBlocks.length > 0) {
    // No highlight marker, select the largest code block
    selectedCodeBlock = allCodeBlocks.reduce((largest, current) =>
      current.code.length > largest.code.length ? current : largest
    )
  }

  return {
    title,
    language: selectedCodeBlock?.language || 'typescript',
    code: selectedCodeBlock?.code || '// No code available',
    highlight
  }
}

// Load tutorial content from a specific tutorial directory
export async function loadTutorialContent(tutorialName: string): Promise<TutorialContent> {
  const basePath = `/content/${tutorialName}`

  // Load story configuration
  const storyResponse = await fetch(`${basePath}/story.json`)
  const story: StoryStep[] = await storyResponse.json()

  // Load code snippets and full content
  const codeSnippets: Record<string, CodeSnippet> = {}

  for (const step of story) {
    try {
      const response = await fetch(`${basePath}/${step.key}.md`)
      const content = await response.text()

      // Parse code snippet
      codeSnippets[step.key] = parseMarkdownContent(content)

      // Preprocess GitBook syntax and render full markdown as HTML
      const preprocessed = preprocessGitBookHints(content)
      let html = await marked.parse(preprocessed)
      html = addScrollAnchors(html)
      step.fullContent = html
    } catch (error) {
      console.warn(`Failed to load content for ${step.key}:`, error)
      // Fallback to empty content
      codeSnippets[step.key] = {
        title: 'Loading...',
        language: 'typescript',
        code: '// Content loading...'
      }
      step.fullContent = '<p>Content loading...</p>'
    }

    // Load subsection content if it exists
    if (step.subsections) {
      for (const subsection of step.subsections) {
        // Ensure subsection's codeKey points to actual code
        const targetCodeKey = subsection.codeKey || step.codeKey || step.key

        // Load the code file if not already loaded
        if (targetCodeKey && !codeSnippets[targetCodeKey]) {
          try {
            const response = await fetch(`${basePath}/${targetCodeKey}.md`)
            const content = await response.text()
            codeSnippets[targetCodeKey] = parseMarkdownContent(content)
          } catch (error) {
            console.warn(`Failed to load code for ${targetCodeKey}:`, error)
          }
        }

        // Create an alias so subsection.key also points to the same code
        if (targetCodeKey && codeSnippets[targetCodeKey]) {
          codeSnippets[subsection.key] = codeSnippets[targetCodeKey]
        }

        // Subsections inherit the parent's fullContent (they show sections of the main tutorial)
        // This way subsections display the parent's tutorial markdown, not separate files
        subsection.fullContent = step.fullContent || `<p>${subsection.copy}</p>`
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