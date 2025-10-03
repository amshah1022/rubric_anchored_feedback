/**
 * Intention Detector for MIRS Category Detection
 * Two-step detector:
 * 1) Deterministic mapping using category labels, item names, and regex triggers
 * 2) Optional LLM fallback to disambiguate
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import {
  MIRS_CATEGORIES,
  CATEGORY_LABELS,
  SYNONYMS,
  type MirsCategory,
  type CategoryDetectionResult
} from './mirs-categories';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export class IntentionDetector {
  private lastCategory: MirsCategory | null = null;
  private readonly useLlmFallback: boolean;
  private readonly maxHistoryChars: number;

  constructor(
    options: {
      useLlmFallback?: boolean;
      maxHistoryChars?: number;
    } = {}
  ) {
    this.useLlmFallback = options.useLlmFallback ?? true;
    this.maxHistoryChars = options.maxHistoryChars ?? 2400;
  }

  async detect(
    userText: string,
    history: ConversationTurn[] = []
  ): Promise<CategoryDetectionResult> {
    // Normalize input
    const normalizedText = this.normalizeText(userText);

    // 1) Exact category label match (e.g., "OPEN", "Opens the Discussion")
    for (const [categoryKey, categoryLabel] of Object.entries(CATEGORY_LABELS)) {
      if (
        normalizedText === categoryKey.toLowerCase() ||
        normalizedText === categoryLabel.toLowerCase()
      ) {
        this.lastCategory = categoryKey as MirsCategory;
        return { category: categoryKey as MirsCategory, reason: "direct category match" };
      }
    }

    // 2) Item name exact/substring match
    for (const [categoryKey, items] of Object.entries(MIRS_CATEGORIES)) {
      for (const item of items) {
        if (normalizedText.includes(item.toLowerCase())) {
          this.lastCategory = categoryKey as MirsCategory;
          return {
            category: categoryKey as MirsCategory,
            reason: `matched item '${item}'`
          };
        }
      }
    }

    // 3) Regex trigger patterns
    for (const [categoryKey, patterns] of Object.entries(SYNONYMS)) {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(normalizedText)) {
          // Check if the trigger is in quotes (shouldn't switch category)
          const quotedPattern = new RegExp(`[""'\\'].*${pattern}.*[""'\\']`, 'i');
          if (quotedPattern.test(userText)) {
            continue;
          }

          this.lastCategory = categoryKey as MirsCategory;
          return {
            category: categoryKey as MirsCategory,
            reason: `trigger '${pattern}'`
          };
        }
      }
    }

    // 4) Keep previous category if available
    if (this.lastCategory) {
      return {
        category: this.lastCategory,
        reason: "kept previous due to ambiguity"
      };
    }

    // 5) Optional LLM fallback
    if (this.useLlmFallback) {
      const llmResult = await this.fallbackLlm(userText, history);
      if (llmResult.isOk()) {
        const { category, reason } = llmResult.value;
        if (category in MIRS_CATEGORIES) {
          this.lastCategory = category as MirsCategory;
          return { category: category as MirsCategory, reason };
        }
      }
    }

    // Default fallback
    this.lastCategory = "OPEN";
    return { category: "OPEN", reason: "default to OPEN (no clear signal)" };
  }

  private normalizeText(text: string): string {
    if (!text) return "";
    
    // Replace smart quotes with regular quotes
    let normalized = text.replace(/[""]/g, '"').replace(/'/g, "'");
    
    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, " ").trim();
    
    return normalized.toLowerCase();
  }

  private async fallbackLlm(
    userText: string,
    history: ConversationTurn[]
  ): Promise<Result<{ category: string; reason: string }, Error>> {
    try {
      const historySnippet = this.createHistorySnippet(history);
      const categories = Object.keys(MIRS_CATEGORIES).join(', ');

      const systemPrompt = `You map learner input to exactly one MIRS category: ${categories}. 
Prefer OPEN/GATH/PERS/SHARE/AGREE/CLOSE over REL when an item there is named. 
Never return confidence. Return the category and reason for your choice.`;

      const userPrompt = `HISTORY:\n${historySnippet}\n\nINPUT:\n${userText}`;

      const result = await generateObject({
        model: openai('gpt-4.1-2025-04-14'),
        temperature: 0,
        schema: z.object({
          category: z.string(),
          reason: z.string()
        }),
        system: systemPrompt,
        prompt: userPrompt,
      });

      return ok({
        category: result.object.category,
        reason: result.object.reason
      });
    } catch (error) {
      return err(new Error(`LLM fallback error: ${error}`));
    }
  }

  private createHistorySnippet(history: ConversationTurn[]): string {
    const buffer: string[] = [];
    let totalChars = 0;

    // Process history in reverse to keep most recent turns
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      const prefix = turn.role === 'user' ? 'LEARNER: ' : 'DIALOGIC_FEEDBACK: ';
      const piece = prefix + turn.content.trim();
      
      totalChars += piece.length + 1;
      if (totalChars > this.maxHistoryChars) {
        break;
      }
      
      buffer.unshift(piece);
    }

    return buffer.join('\n');
  }
}