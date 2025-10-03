import { os } from '@orpc/server'
import { z } from 'zod'
import { generateText, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { db } from '@/lib/db'
import { conversationGrade, TableDialogicFeedbackMessage } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { Result, ok, err, ResultAsync } from 'neverthrow'
import { endpointWithFoundationalAuth } from './common'
import { IntentionDetector } from '@/lib/dialogic-feedback/intention-detector'
import { 
  MIRS_CATEGORIES, 
  CATEGORY_LABELS,
  type MirsCategory 
} from '@/lib/dialogic-feedback/mirs-categories'
import type {
  RefinementPayload,
  ScoreEntry,
  ConversationTurn,
  ConversationQuote
} from '@/lib/dialogic-feedback/types'

// Input schemas
const getConversationHistorySchema = z.object({
  conversationGradeId: z.string()
})

const sendMessageSchema = z.object({
  conversationGradeId: z.string(),
  message: z.string()
})

// Dialogic Feedback Coach Class
class DialogicFeedbackCoach {
  private readonly model: string
  private readonly maxHistoryChars: number
  private readonly targetSentenceRange: [number, number]
  private readonly askOneQuestion: boolean

  constructor(options: {
    model?: string
    maxHistoryChars?: number
    targetSentenceRange?: [number, number]
    askOneQuestion?: boolean
  } = {}) {
    this.model = options.model ?? 'gpt-4.1-2025-04-14'
    this.maxHistoryChars = options.maxHistoryChars ?? 4000
    this.targetSentenceRange = options.targetSentenceRange ?? [3, 6]
    this.askOneQuestion = options.askOneQuestion ?? true
  }

  buildSystemPrompt(
    category: MirsCategory,
    refinement: RefinementPayload,
    metrics: Record<string, ScoreEntry>
  ): string {
    // Get category-specific items
    const categoryItems = MIRS_CATEGORIES[category] || []
    
    // Build scores block for this category
    const scoreLines: string[] = []
    for (const item of categoryItems) {
      if (item in metrics) {
        const scoreEntry = metrics[item]
        scoreLines.push(`- ${item}: score=${scoreEntry.score}; why: ${scoreEntry.explanation}`)
      }
    }
    const scoresBlock = scoreLines.length > 0 
      ? scoreLines.join('\n') 
      : '(no per-item scores available for this category)'

    // Build actionable suggestions
    const suggestions = refinement.actionable_suggestions
      .map(s => `- ${s}`)
      .join('\n') || '- (none provided)'

    // Build quotes block
    const quotesLines: string[] = []
    for (const quote of refinement.quotes) {
      const idx = quote.index ?? '?'
      const speaker = quote.speaker ?? '?'
      const text = quote.quote?.trim()
      if (text) {
        quotesLines.push(`[${idx}] ${speaker}: "${text}"`)
      }
    }
    const quotesBlock = quotesLines.length > 0 
      ? quotesLines.join('\n') 
      : '(no quotes provided)'

    const [minSentences, maxSentences] = this.targetSentenceRange
    const categoryLabel = CATEGORY_LABELS[category] || category

    return `You are an **Expert MIRS Communication Coach** helping medical students improve
their communication skills. Stay *strictly within* the active category.

RULES
- Coach ONLY within this category: ${category} = ${categoryLabel}.
- Do NOT re-grade; the numeric score and explanation are fixed from prior analysis.
- Keep replies short (${minSentences}–${maxSentences} sentences). Ask EXACTLY one guiding question.
- Be constructive, specific, and link points to the MIRS item behaviors in scope.
- Invite the learner to revise the goal in their own words.
- Maintain a warm, professional tone.

ANCHOR CONTEXT (from refinement step; do not contradict)
- Final feedback (one paragraph): ${refinement.final_feedback}
- Why this MIRS item matters (Rationale): ${refinement.rationale}
- Fixed score: ${refinement.score}; Fixed explanation: ${refinement.explanation}
- Actionable suggestions (2–4): 
${suggestions}

QUOTES (keep indices stable if you cite them)
${quotesBlock}

THIS-CATEGORY ITEMS IN SCOPE
${categoryItems.map(item => `- ${item}`).join('\n') || '(no items listed)'}

SCORES FOR THIS CATEGORY (use as evidence; never re-grade)
${scoresBlock}

When responding:
- Address the learner's latest message specifically.
- Tie feedback to the above items/quotes/suggestions where relevant.
- If the learner wanders outside this category, briefly refocus and continue coaching within this category only.`
  }

  public trimHistoryToCharLimit(history: ConversationTurn[]): ConversationTurn[] {
    const result: ConversationTurn[] = []
    let totalChars = 0

    // Process in reverse to keep most recent turns
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i]
      const content = turn.content?.trim() || ''
      totalChars += content.length + 20 // Add some buffer for role markers

      if (totalChars >= this.maxHistoryChars && result.length > 0) {
        break
      }

      result.unshift(turn)
    }

    return result
  }

  async generateResponse(
    userText: string,
    category: MirsCategory,
    history: ConversationTurn[],
    refinement: RefinementPayload,
    metrics: Record<string, ScoreEntry>
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(category, refinement, metrics)
    const trimmedHistory = this.trimHistoryToCharLimit(history)
    
    // Build messages array
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...trimmedHistory.map(turn => ({
        role: turn.role as 'user' | 'assistant',
        content: turn.content
      })),
      { role: 'user' as const, content: userText }
    ]

    try {
      const result = await generateText({
        model: openai(this.model),
        messages,
        temperature: 0.7,
      })

      return result.text
    } catch (error) {
      return `I apologize, but I encountered an error while generating feedback. Please try again. (${error})`
    }
  }
}

// Helper function to get conversation grade ID from scoreId
async function getConversationGradeId(scoreId: string): Promise<Result<number, Error>> {
  try {
    const grade = await db.query.conversationGrade.findFirst({
      where: eq(conversationGrade.scoreId, scoreId),
      columns: { id: true }
    })
    
    if (!grade) {
      return err(new Error('Conversation grade not found'))
    }
    
    return ok(grade.id)
  } catch (error) {
    return err(new Error(`Failed to get conversation grade ID: ${error}`))
  }
}

// Helper function to fetch grade data and build context
async function fetchGradeContext(scoreId: string): Promise<Result<{
  refinement: RefinementPayload
  metrics: Record<string, ScoreEntry>
}, Error>> {
  try {
    const resultOfGrade = await ResultAsync.fromPromise(
      db.query.conversationGrade.findFirst({
        where: eq(conversationGrade.scoreId, scoreId)
      }),
      (error) => error
    )

    if (resultOfGrade.isErr()) {
      return err(new Error('Failed to fetch grade data'))
    }

    const grade = resultOfGrade.value
    if (!grade) {
      return err(new Error('Grade not found'))
    }

    // Check if annotatedTranscriptV1 exists
    if (!grade.annotatedTranscriptV1 || typeof grade.annotatedTranscriptV1 !== 'object') {
      return err(new Error('Conversation has not been fully processed yet. Please wait for scoring to complete.'))
    }

    const annotatedTranscript = grade.annotatedTranscriptV1;
    const selectedFeedbackItems = annotatedTranscript.selected_feedback_items || []

    if (!Array.isArray(selectedFeedbackItems) || selectedFeedbackItems.length === 0) {
      return err(new Error('No refined feedback items available for this conversation.'))
    }

    // Validate that items have required fields according to the actual schema
    const validItems = selectedFeedbackItems.filter((item) => 
      item.mirs_name && 
      typeof item.score === 'number' && 
      Array.isArray(item.quotes)
    )

    if (validItems.length === 0) {
      return err(new Error('No valid feedback items found with required MIRS data.'))
    }

    // Create combined refinement payload from valid items
    // Use the first valid item as the primary source, but combine data intelligently
    const primaryItem = validItems[0] // First valid item
    
    // Combine all quotes from valid items
    const allQuotes: ConversationQuote[] = []

    validItems.forEach((item) => {
      if (item.quotes && Array.isArray(item.quotes)) {
        item.quotes.forEach((quote) => {
          allQuotes.push({
            index: quote.transcript_index || 0,
            speaker: 'unknown', // speaker field doesn't exist in schema, using fallback
            quote: quote.quote || ''
          })
        })
      }
      // actionable_suggestions field doesn't exist in the actual schema
      // Will generate suggestions based on available data instead
    })

    // Generate actionable suggestions based on available data
    const generatedSuggestions = [
      `Focus on improving your ${primaryItem.mirs_name || 'communication skills'}`,
      "Practice the specific behaviors identified in the feedback",
      "Review the highlighted conversation moments for learning opportunities"
    ]

    // Extract indices from quotes for the index field
    const quoteIndices = allQuotes.map(q => q.index)

    const refinement: RefinementPayload = {
      final_feedback: `Based on your performance in ${primaryItem.mirs_name || 'communication skills'}, here are key areas for growth: ${primaryItem.selection_rationale || 'Multiple aspects of your communication show potential for improvement.'}`,
      rationale: primaryItem.selection_rationale || "This skill matters because it improves patient understanding, trust, and safety.",
      quotes: allQuotes,
      index: quoteIndices,
      actionable_suggestions: generatedSuggestions,
      score: primaryItem.score || 3,
      explanation: `Score: ${primaryItem.score || 3}/5. ${primaryItem.selection_rationale || 'Areas for improvement have been identified based on communication effectiveness.'}`
    }

    // Build metrics from all valid feedback items
    const metrics: Record<string, ScoreEntry> = {}
    validItems.forEach((item) => {
      metrics[item.mirs_name] = {
        score: item.score,
        explanation: item.selection_rationale || `${item.mirs_name} scored ${item.score}/5 based on performance analysis.`
      }
    })

    // Also include any additional MIRS scores from the grade
    if (grade.mirsScores && typeof grade.mirsScores === 'object') {
      Object.entries(grade.mirsScores).forEach(([itemName, itemData]: [string, any]) => {
        if (itemData?.score !== undefined && itemData?.explanation && !metrics[itemName]) {
          metrics[itemName] = {
            score: Number(itemData.score) || 0,
            explanation: String(itemData.explanation) || ''
          }
        }
      })
    }

    return ok({ refinement, metrics })
  } catch (error) {
    return err(new Error(`Error fetching grade context: ${error}`))
  }
}

// Database operations for message persistence
async function saveMessage(
  userId: number,
  conversationGradeId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  categoryDetected?: string
): Promise<Result<void, Error>> {
  try {
    await db.insert(TableDialogicFeedbackMessage).values({
      userId,
      conversationGradeId,
      role,
      content,
      categoryDetected: categoryDetected || null,
    })
    return ok(undefined)
  } catch (error) {
    return err(new Error(`Failed to save message: ${error}`))
  }
}

async function loadConversationMessages(
  userId: number,
  conversationGradeId: number
): Promise<Result<Array<{
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  categoryDetected: string | null
  createdAt: string
}>, Error>> {
  try {
    const messages = await db
      .select({
        id: TableDialogicFeedbackMessage.id,
        role: TableDialogicFeedbackMessage.role,
        content: TableDialogicFeedbackMessage.content,
        categoryDetected: TableDialogicFeedbackMessage.categoryDetected,
        createdAt: TableDialogicFeedbackMessage.createdAt,
      })
      .from(TableDialogicFeedbackMessage)
      .where(
        and(
          eq(TableDialogicFeedbackMessage.userId, userId),
          eq(TableDialogicFeedbackMessage.conversationGradeId, conversationGradeId)
        )
      )
      .orderBy(TableDialogicFeedbackMessage.createdAt)

    return ok(messages)
  } catch (error) {
    return err(new Error(`Failed to load conversation history: ${error}`))
  }
}

// Get conversation history
export const getConversationHistory = endpointWithFoundationalAuth
  .input(getConversationHistorySchema)
  .output(z.object({
    success: z.boolean(),
    messages: z.array(z.object({
      id: z.number(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      categoryDetected: z.string().nullable(),
      createdAt: z.string()
    }))
  }))
  .handler(async ({ input, context, errors }) => {
    const { conversationGradeId } = input

    // Get conversation grade ID
    const gradeIdResult = await getConversationGradeId(conversationGradeId)
    if (gradeIdResult.isErr()) {
      throw errors.BAD_REQUEST({
        data: {
          title: 'Invalid Conversation',
          description: 'Conversation grade not found',
          helpText: 'Check if the conversation grade ID is valid',
          type: 'BAD_REQUEST'
        }
      })
    }

    // Load conversation history
    const historyResult = await loadConversationMessages(context.user.id, gradeIdResult.value)
    if (historyResult.isErr()) {
      throw errors.INTERNAL_SERVER_ERROR({
        data: {
          title: 'Database Error',
          description: 'Failed to load conversation history',
          helpText: 'Please try again',
          type: 'INTERNAL_SERVER_ERROR'
        }
      })
    }

    return {
      success: true,
      messages: historyResult.value
    }
  })

// Send message and get streamed response
export const sendMessage = endpointWithFoundationalAuth
  .input(sendMessageSchema)
  .handler(async function* ({ input, context, signal, errors }) {
    const { conversationGradeId, message } = input

    try {
      // Get conversation grade ID
      const gradeIdResult = await getConversationGradeId(conversationGradeId)
      if (gradeIdResult.isErr()) {
        yield { type: 'error', error: 'Conversation grade not found' }
        return
      }

      const gradeId = gradeIdResult.value

      // Save user message immediately
      const saveUserResult = await saveMessage(
        context.user.id,
        gradeId,
        'user',
        message
      )
      if (saveUserResult.isErr()) {
        yield { type: 'error', error: 'Failed to save user message' }
        return
      }

      // Load conversation history
      const historyResult = await loadConversationMessages(context.user.id, gradeId)
      if (historyResult.isErr()) {
        yield { type: 'error', error: 'Failed to load conversation history' }
        return
      }

      // Convert to ConversationTurn format for intention detection
      const history: ConversationTurn[] = historyResult.value
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))

      // Fetch grade context for coaching prompts
      const contextResult = await fetchGradeContext(conversationGradeId)
      if (contextResult.isErr()) {
        yield { type: 'error', error: 'Failed to load grade context' }
        return
      }

      const { refinement, metrics } = contextResult.value

      // Initialize intention detector and coach
      const intentionDetector = new IntentionDetector({ useLlmFallback: true })
      const coach = new DialogicFeedbackCoach()

      // Detect category for this turn
      const detection = await intentionDetector.detect(message, history)

      // Build messages for streaming
      const systemPrompt = coach.buildSystemPrompt(detection.category, refinement, metrics)
      const trimmedHistory = coach.trimHistoryToCharLimit(history)

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...trimmedHistory.map(turn => ({
          role: turn.role as 'user' | 'assistant',
          content: turn.content
        })),
        { role: 'user' as const, content: message }
      ]

      // Stream response
      const result = await streamText({
        model: openai('gpt-4.1-2025-04-14'),
        messages,
        temperature: 0,
      })

      let fullResponse = ''

      // Stream text deltas
      for await (const delta of result.textStream) {
        if (signal?.aborted) {
          return
        }
        fullResponse += delta
        yield { type: 'text-delta', textDelta: delta }
      }

      // Save assistant response
      await saveMessage(
        context.user.id,
        gradeId,
        'assistant',
        fullResponse,
        detection.category
      )

      // Send finish event with category info
      yield {
        type: 'finish',
        category: detection.category,
        categoryLabel: CATEGORY_LABELS[detection.category] || detection.category,
        reason: detection.reason
      }

    } catch (error) {
      yield { type: 'error', error: `Failed to generate response: ${error}` }
    }
  })

// Export the dialogic feedback router
export const dialogicFeedbackRouter = os.router({
  getConversationHistory,
  sendMessage
})
