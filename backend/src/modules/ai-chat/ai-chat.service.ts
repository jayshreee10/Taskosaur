import { Injectable, BadRequestException } from '@nestjs/common';
import { ChatRequestDto, ChatResponseDto, ChatMessageDto } from './dto/chat.dto';
import { SettingsService } from '../settings/settings.service';
import * as commandsData from '../../constants/commands.json';

@Injectable()
export class AiChatService {
  private commands: any;
  // Store conversation context per session/user
  private conversationContexts: Map<string, {
    workspaceSlug?: string;
    workspaceName?: string;
    projectSlug?: string;
    projectName?: string;
    lastUpdated: Date;
  }> = new Map();

  constructor(private settingsService: SettingsService) {
    // Load commands from imported JSON
    this.commands = commandsData;
    // Clean up old contexts every hour
    setInterval(() => this.cleanupOldContexts(), 3600000);
  }
  
  private cleanupOldContexts() {
    const oneHourAgo = new Date(Date.now() - 3600000);
    for (const [sessionId, context] of this.conversationContexts.entries()) {
      if (context.lastUpdated < oneHourAgo) {
        this.conversationContexts.delete(sessionId);
      }
    }
  }

  private detectProvider(apiUrl: string): string {
    if (apiUrl.includes('openrouter.ai')) return 'openrouter';
    if (apiUrl.includes('api.openai.com')) return 'openai';
    if (apiUrl.includes('api.anthropic.com')) return 'anthropic';
    if (apiUrl.includes('generativelanguage.googleapis.com')) return 'google';
    return 'custom'; // fallback for unknown providers
  }

  private generateSystemPrompt(sessionContext?: { workspaceSlug?: string; workspaceName?: string; projectSlug?: string; projectName?: string; }): string {
    // Generate system prompt dynamically from commands.json
    const commandList = this.commands.commands.map(cmd => {
      const requiredParams = cmd.params.filter(p => !p.endsWith('?'));
      const optionalParams = cmd.params.filter(p => p.endsWith('?'));
      
      let paramDescription = '';
      if (requiredParams.length > 0) {
        paramDescription = `needs ${requiredParams.join(', ')}`;
      }
      if (optionalParams.length > 0) {
        const cleanOptional = optionalParams.map(p => p.replace('?', ''));
        paramDescription += paramDescription ? `, optional: ${cleanOptional.join(', ')}` : `optional: ${cleanOptional.join(', ')}`;
      }
      
      const paramObj = cmd.params.reduce((obj, param) => {
        const cleanParam = param.replace('?', '');
        obj[cleanParam] = cleanParam.includes('Slug') ? 'slug' : 'value';
        return obj;
      }, {});
      
      return `- ${cmd.name}: ${paramDescription} → [COMMAND: ${cmd.name}] ${JSON.stringify(paramObj)}`;
    }).join('\n');

    return `You are Taskosaur AI Assistant. You can ONLY execute predefined commands - NEVER create bash commands or make up new commands.

AVAILABLE COMMANDS:
${commandList}

CRITICAL RULES:
1. NEVER generate bash commands, shell scripts, or fake commands like "workspace_enter"
2. ONLY use the predefined [COMMAND: commandName] format above
3. If user asks for something, match it to one of the available commands
4. If no command matches, explain what commands are available instead

COMMAND EXECUTION FORMAT:
- Use EXACT format: [COMMAND: commandName] {"param": "value"}
- Example: [COMMAND: navigateToWorkspace] {"workspaceSlug": "dummy"}

PARAMETER VALIDATION - STRICTLY REQUIRED:
1. Check if ALL required parameters are provided in user message
2. If ANY required parameter missing, NEVER execute the command
3. Instead, ask specific follow-up questions for missing parameters
4. Only execute command after ALL required parameters are collected
5. Remember user's original intent while collecting missing parameters

WORKSPACE CREATION RULES:
- "createWorkspace" ALWAYS requires BOTH name AND description
- NEVER execute createWorkspace with missing description
- ALWAYS ask for description before creating workspace

EXAMPLES OF PROPER PARAMETER COLLECTION:
- User: "create workspace MySpace" 
- Response: "I'll create a workspace named 'MySpace'. What description would you like for this workspace?"
- Wait for description, then execute: [COMMAND: createWorkspace] {"name": "MySpace", "description": "user_provided_description"}

- User: "create task X"
- Response: "I'll create task 'X'. Which workspace and project should I create this task in?"
- Wait for workspace/project, then execute command

NAVIGATION EXAMPLES:
- "take me to workspace X" → [COMMAND: navigateToWorkspace] {"workspaceSlug": "x"}  
- "go to project Y" → [COMMAND: navigateToProject] {"workspaceSlug": "current", "projectSlug": "y"}
- "show workspaces" → [COMMAND: listWorkspaces] {}

EDITING EXAMPLES:
- "rename workspace test to My New Name" → [COMMAND: editWorkspace] {"workspaceSlug": "test", "updates": {"name": "My New Name"}}
- "change workspace abc to Better Name" → [COMMAND: editWorkspace] {"workspaceSlug": "abc", "updates": {"name": "Better Name"}}
- "edit workspace xyz to New Title" → [COMMAND: editWorkspace] {"workspaceSlug": "xyz", "updates": {"name": "New Title"}}

CONTEXT-AWARE EXAMPLES:
- "create task under Workspace X" → Remember X for future commands, ask for project details
- "list projects" (after workspace mentioned) → [COMMAND: listProjects] {"workspaceSlug": "x"}
- "show me projects in Workspace Y" → [COMMAND: listProjects] {"workspaceSlug": "y"}

WORKSPACE NAME CONVERSION:
- "Hyscaler Workspace" → slug: "hyscaler-workspace"
- "My Test Space" → slug: "my-test-space" 
- "Personal Projects" → slug: "personal-projects"
- Always convert spaces to hyphens and make lowercase for slugs

CRITICAL REMINDER:
- NEVER execute commands with missing required parameters
- ALWAYS ask for missing information before executing
- createWorkspace requires BOTH name AND description - NO EXCEPTIONS
- Be helpful but wait for complete information

${sessionContext && (sessionContext.workspaceSlug || sessionContext.projectSlug) ? `

CURRENT CONTEXT:
${sessionContext.workspaceSlug ? `- Current Workspace: ${sessionContext.workspaceName || sessionContext.workspaceSlug} (slug: ${sessionContext.workspaceSlug})
` : ''}${sessionContext.projectSlug ? `- Current Project: ${sessionContext.projectName || sessionContext.projectSlug} (slug: ${sessionContext.projectSlug})` : ''}` : ''}`;
  }

  private validateCommandParameters(commandName: string, parameters: Record<string, any>): { valid: boolean; missing: string[]; message?: string } {
    const command = this.commands.commands.find(cmd => cmd.name === commandName);
    if (!command) {
      return { valid: false, missing: [], message: `Unknown command: ${commandName}` };
    }

    const requiredParams = command.params.filter(p => !p.endsWith('?'));
    const missing = requiredParams.filter(param => !parameters[param] || parameters[param].toString().trim() === '');
    
    if (missing.length > 0) {
      return { 
        valid: false, 
        missing,
        message: `Missing required parameters for ${commandName}: ${missing.join(', ')}`
      };
    }

    return { valid: true, missing: [] };
  }

  async chat(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      // Check if AI is enabled
      const isEnabled = await this.settingsService.get('ai_enabled');
      if (isEnabled !== 'true') {
        throw new BadRequestException('AI chat is currently disabled. Please enable it in settings.');
      }

      // Get or create session context
      const sessionId = chatRequest.sessionId || 'default';
      let sessionContext = this.conversationContexts.get(sessionId);
      if (!sessionContext) {
        sessionContext = { lastUpdated: new Date() };
        this.conversationContexts.set(sessionId, sessionContext);
        console.log(`[CONTEXT] Created new session context for: ${sessionId}`);
      } else {
        console.log(`[CONTEXT] Using existing context for session ${sessionId}:`, sessionContext);
      }

      // Get API settings from database
      const [apiKey, model, apiUrl] = await Promise.all([
        this.settingsService.get('ai_api_key'),
        this.settingsService.get('ai_model', 'deepseek/deepseek-chat-v3-0324:free'),
        this.settingsService.get('ai_api_url', 'https://openrouter.ai/api/v1')
      ]);

      const provider = this.detectProvider(apiUrl || 'https://openrouter.ai/api/v1');

      if (!apiKey) {
        throw new BadRequestException('AI API key not configured. Please set it in settings.');
      }

      // Build messages array with system prompt and conversation history
      const messages: ChatMessageDto[] = [];
      
      // Generate dynamic system prompt from commands.json with session context
      const systemPrompt = this.generateSystemPrompt(sessionContext);

      messages.push({
        role: 'system',
        content: systemPrompt
      });
      
      // Add conversation history if provided
      if (chatRequest.history && Array.isArray(chatRequest.history)) {
        chatRequest.history.forEach((msg: ChatMessageDto) => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }
      
      // Extract and update context from user message before processing
      this.extractContextFromMessage(sessionId, chatRequest.message, sessionContext);
      
      // Add current user message
      messages.push({
        role: 'user',
        content: chatRequest.message
      });

      // Prepare request based on provider
      let requestUrl = apiUrl;
      let requestHeaders: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      let requestBody: any = {
        model,
        messages,
        temperature: 0.1,
        max_tokens: 500,
        stream: false,
      };

      // Adjust for different providers
      switch (provider) {
        case 'openrouter':
          requestUrl = `${apiUrl}/chat/completions`;
          requestHeaders['HTTP-Referer'] = process.env.APP_URL || 'http://localhost:3000';
          requestHeaders['X-Title'] = 'Taskosaur AI Assistant';
          requestBody.top_p = 0.9;
          requestBody.frequency_penalty = 0;
          requestBody.presence_penalty = 0;
          break;
          
        case 'openai':
          requestUrl = `${apiUrl}/chat/completions`;
          requestBody.top_p = 0.9;
          requestBody.frequency_penalty = 0;
          requestBody.presence_penalty = 0;
          break;
          
        case 'anthropic':
          requestUrl = `${apiUrl}/messages`;
          requestHeaders['x-api-key'] = apiKey;
          requestHeaders['anthropic-version'] = '2023-06-01';
          delete requestHeaders['Authorization'];
          requestBody = {
            model,
            messages: messages.filter(m => m.role !== 'system'), // Anthropic doesn't use system role the same way
            system: messages.find(m => m.role === 'system')?.content,
            max_tokens: 500,
            temperature: 0.1,
          };
          break;
          
        case 'google':
          // Google Gemini has a different API structure
          requestUrl = `${apiUrl}/models/${model}:generateContent?key=${apiKey}`;
          delete requestHeaders['Authorization'];
          requestBody = {
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : m.role,
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            }
          };
          break;
          
        default: // custom or openrouter fallback
          requestUrl = `${apiUrl}/chat/completions`;
          break;
      }

      // Call API
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new BadRequestException('Invalid API key. Please check your OpenRouter API key in settings.');
        } else if (response.status === 429) {
          throw new BadRequestException('Rate limit exceeded by API provider. Please try again in a moment.');
        } else if (response.status === 402) {
          throw new BadRequestException('Insufficient credits. Please check your OpenRouter account.');
        }
        
        throw new BadRequestException(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      let aiMessage = '';

      // Parse response based on provider
      switch (provider) {
        case 'anthropic':
          aiMessage = data.content?.[0]?.text || '';
          break;
          
        case 'google':
          aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          break;
          
        default: // OpenAI, OpenRouter, and custom providers use the same format
          aiMessage = data.choices?.[0]?.message?.content || '';
          break;
      }

      // Parse command if detected
      let action: { name: string; parameters: Record<string, any> } | undefined;
      
      // Try both formats: with ** markers and without
      // Use a more robust regex that handles nested braces
      let commandMatch = aiMessage.match(/\*\*\[COMMAND:\s*([^\]]+)\]\*\*\s*(\{.*\})$/m);
      if (!commandMatch) {
        commandMatch = aiMessage.match(/\[COMMAND:\s*([^\]]+)\]\s*(\{.*\})$/m);
      }
      
      // If still no match, try without requiring closing brace and attempt to fix JSON
      if (!commandMatch) {
        commandMatch = aiMessage.match(/\[COMMAND:\s*([^\]]+)\]\s*(\{.*)/);
      }
      
      if (commandMatch) {
        try {
          const commandName = commandMatch[1].trim();
          const parametersString = commandMatch[2] || '{}';
          
          console.log('[DEBUG] Command detected:', {
            commandName,
            parametersString,
            fullMatch: commandMatch[0]
          });
          
          let parameters: any;
          try {
            parameters = JSON.parse(parametersString);
          } catch (parseError) {
            console.error('[DEBUG] JSON Parse Error, attempting repair:', {
              error: parseError.message,
              parametersString,
              stringLength: parametersString.length,
              charAtPos62: parametersString.charAt(62)
            });
            
            // Attempt to repair incomplete JSON by adding missing closing braces
            let repairedJson = parametersString;
            let openBraces = 0;
            for (let i = 0; i < repairedJson.length; i++) {
              if (repairedJson[i] === '{') openBraces++;
              if (repairedJson[i] === '}') openBraces--;
            }
            
            // Add missing closing braces
            while (openBraces > 0) {
              repairedJson += '}';
              openBraces--;
            }
            
            console.log('[DEBUG] Attempting to parse repaired JSON:', repairedJson);
            
            try {
              parameters = JSON.parse(repairedJson);
              console.log('[DEBUG] JSON repair successful!');
            } catch (repairError) {
              console.error('[DEBUG] JSON repair failed:', repairError.message);
              throw parseError; // Throw original error
            }
          }
          
          // Validate command parameters
          const validation = this.validateCommandParameters(commandName, parameters);
          
          if (!validation.valid) {
            // If validation fails, don't execute the action but return helpful message
            console.log(`Command validation failed for ${commandName}:`, validation.message);
            
            // Override the AI message with parameter collection guidance
            const missingParamsList = validation.missing.length > 0 
              ? `I need the following information to proceed: ${validation.missing.join(', ')}.`
              : validation.message;
            
            // Don't return action if validation fails - this prevents execution
            return {
              message: `${aiMessage}\n\n${missingParamsList}`,
              success: true
            };
          }
          
          // Fill in context-based parameters if missing
          if (sessionContext) {
            // Auto-fill workspace/project if missing and context exists
            if (commandName !== 'listWorkspaces' && commandName !== 'createWorkspace') {
              if (!parameters.workspaceSlug && sessionContext.workspaceSlug) {
                parameters.workspaceSlug = sessionContext.workspaceSlug;
              }
            }
            if (commandName.includes('Task') || commandName.includes('Project')) {
              if (!parameters.projectSlug && sessionContext.projectSlug && parameters.workspaceSlug === sessionContext.workspaceSlug) {
                parameters.projectSlug = sessionContext.projectSlug;
              }
            }
          }
          
          action = {
            name: commandName,
            parameters
          };
          
          // Update context based on command execution
          this.updateContextFromCommand(sessionId, commandName, parameters, sessionContext);
        } catch (error) {
          console.error('Failed to parse command parameters:', error);
        }
      }

      return {
        message: aiMessage,
        action,
        success: true
      };

    } catch (error: any) {
      console.error('AI Chat error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        return {
          message: '',
          success: false,
          error: 'Network error. Please check your internet connection.'
        };
      }
      
      return {
        message: '',
        success: false,
        error: error.message || 'Failed to process chat request'
      };
    }
  }
  
  private updateContextFromCommand(sessionId: string, commandName: string, parameters: Record<string, any>, context: any) {
    // Update workspace context
    if (commandName === 'navigateToWorkspace' || commandName === 'createWorkspace') {
      if (parameters.workspaceSlug) {
        context.workspaceSlug = parameters.workspaceSlug;
        context.workspaceName = parameters.name || parameters.workspaceSlug;
        // Clear project context when switching workspaces
        delete context.projectSlug;
        delete context.projectName;
      }
    }
    
    // Update project context
    if (commandName === 'navigateToProject' || commandName === 'createProject') {
      if (parameters.projectSlug) {
        context.projectSlug = parameters.projectSlug;
        context.projectName = parameters.name || parameters.projectSlug;
      }
      if (parameters.workspaceSlug) {
        context.workspaceSlug = parameters.workspaceSlug;
      }
    }
    
    // Update workspace context from editWorkspace
    if (commandName === 'editWorkspace' && parameters.updates?.name) {
      if (parameters.workspaceSlug) {
        context.workspaceSlug = parameters.workspaceSlug;
        context.workspaceName = parameters.updates.name;
      }
    }
    
    // Update last activity timestamp
    context.lastUpdated = new Date();
    
    // Save updated context
    this.conversationContexts.set(sessionId, context);
  }
  
  private extractContextFromMessage(sessionId: string, message: string, context: any) {
    console.log(`[CONTEXT] Extracting context from message: "${message}"`);
    const lowerMessage = message.toLowerCase();
    let contextUpdated = false;
    
    // Extract workspace mentions - improved patterns
    const workspacePatterns = [
      /(?:go\s+with|use|with)\s+workspace\s+["\']([^"']+)["\']?/gi,
      /workspace\s+is\s+["\']([^"']+)["\']?/gi,
      /use\s+["\']?([^"'.,!?\n]+)\s+workspace["\']?/gi,
      /["\']([^"']+)\s+workspace["\']?/gi,
      /in\s+(?:the\s+)?["\']?([^"'.,!?\n]+)\s+workspace["\']?/gi,
      /["\']?([a-zA-Z][^"'.,!?\n]*?)\s+w[uo]rkspace["\']?/gi
    ];
    
    for (const pattern of workspacePatterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const workspaceName = match[1].trim();
          // Convert name to slug format
          const workspaceSlug = workspaceName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          console.log(`[CONTEXT] ✅ Extracted workspace: "${workspaceName}" -> slug: "${workspaceSlug}"`);
          
          context.workspaceSlug = workspaceSlug;
          context.workspaceName = workspaceName;
          contextUpdated = true;
          
          // Clear project context when switching workspaces (unless mentioned in same message)
          if (!lowerMessage.includes('project')) {
            delete context.projectSlug;
            delete context.projectName;
          }
          
          break; // Use first match
        }
      }
    }
    
    // Extract project mentions - improved patterns  
    const projectPatterns = [
      // "Ok, go with HIMS project"
      /(?:ok,?\s+)?(?:go\s+with|use|with)\s+["\']?([^"'.,!?\n]+?)\s+project["\']?/gi,
      // "I choose hims"
      /(?:i\s+)?(?:choose|select|pick)\s+["\']?([^"'.,!?\n]+)["\']?/gi,
      // "project is HIMS"
      /project\s+is\s+["\']?([^"'.,!?\n]+)["\']?/gi,
      // "HIMS project"
      /["\']?([^"'.,!?\n\s]+)\s+project["\']?/gi,
      // "in HIMS project"
      /in\s+(?:the\s+)?["\']?([^"'.,!?\n]+?)\s+project["\']?/gi
    ];
    
    for (const pattern of projectPatterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          let projectName = match[1].trim();
          
          // Skip if it looks like a workspace (contains 'workspace')
          if (projectName.toLowerCase().includes('workspace') || projectName.toLowerCase().includes('wokspace')) {
            continue;
          }
          
          // Skip common words that aren't project names
          const skipWords = [
            'yes', 'no', 'ok', 'fine', 'good', 'sure', 'right', 'correct', 'thanks', 'thank you',
            'i want to create a task drink water', 'can you first list the projects sot hat i can choose',
            'the', 'a', 'an', 'and', 'or', 'but', 'with', 'without', 'please', 'help'
          ];
          if (skipWords.some(word => projectName.toLowerCase().includes(word)) || 
              projectName.toLowerCase().startsWith('i want to') ||
              projectName.toLowerCase().startsWith('can you')) {
            continue;
          }
          
          // Convert name to slug format
          const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          console.log(`[CONTEXT] ✅ Extracted project: "${projectName}" -> slug: "${projectSlug}"`);
          
          context.projectSlug = projectSlug;
          context.projectName = projectName;
          contextUpdated = true;
          
          break; // Use first match
        }
      }
    }
    
    // Update last activity timestamp and save context
    if (contextUpdated) {
      context.lastUpdated = new Date();
      this.conversationContexts.set(sessionId, context);
      console.log(`[CONTEXT] ✅ Context updated for session ${sessionId}:`, context);
    } else {
      console.log(`[CONTEXT] ❌ No context extracted from message`);
    }
  }

  // Clear context for a specific session
  clearContext(sessionId: string): { success: boolean } {
    if (this.conversationContexts.has(sessionId)) {
      this.conversationContexts.delete(sessionId);
      console.log(`[CONTEXT] 🔄 Cleared context for session: ${sessionId}`);
    } else {
      console.log(`[CONTEXT] ⚠️ No context found for session: ${sessionId}`);
    }
    return { success: true };
  }
}