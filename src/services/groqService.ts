import { AttachedContext, ChatMessage, GroqConfig, StoredApiKey } from '../types';

const GROQ_STORAGE_KEY = 'sql_studio_groq_config_v2';
const OLD_GROQ_STORAGE_KEY = 'sql_studio_groq_config_v1';

export const DEFAULT_GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', desc: 'Recommended: State-of-the-art SQL reasoning' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', desc: 'Blazing fast, ultra-low latency' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', desc: 'Deep mathematical & analytical reasoning' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', desc: 'Large context window for heavy schemas' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', desc: 'Google lightweight instruction model' }
];

export const groqService = {
  getConfig(): GroqConfig {
    try {
      const stored = localStorage.getItem(GROQ_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.keysList)) {
          return parsed;
        }
      }
      // Check old storage migration
      const oldStored = localStorage.getItem(OLD_GROQ_STORAGE_KEY);
      if (oldStored) {
        const oldParsed = JSON.parse(oldStored);
        if (oldParsed?.apiKey) {
          const migrated: GroqConfig = {
            apiKey: oldParsed.apiKey,
            model: oldParsed.model || 'llama-3.3-70b-versatile',
            temperature: 0.2,
            keysList: [
              {
                id: 'key_migrated_' + Date.now(),
                name: 'Default Groq Key',
                key: oldParsed.apiKey,
                isDefault: true,
                addedAt: Date.now()
              }
            ]
          };
          this.saveConfig(migrated);
          return migrated;
        }
      }
    } catch (e) {
      console.warn('Failed to load Groq config', e);
    }

    return {
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      keysList: []
    };
  },

  saveConfig(config: GroqConfig): void {
    try {
      localStorage.setItem(GROQ_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save Groq config', e);
    }
  },

  clearConfig(): void {
    try {
      localStorage.removeItem(GROQ_STORAGE_KEY);
      localStorage.removeItem(OLD_GROQ_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear Groq config', e);
    }
  },

  addApiKey(name: string, key: string, setAsDefault: boolean = false): StoredApiKey {
    const config = this.getConfig();
    const cleanKey = key.trim();
    const cleanName = name.trim() || 'Groq Key';
    const isFirst = config.keysList.length === 0;
    const shouldBeDefault = setAsDefault || isFirst;

    const newKeyItem: StoredApiKey = {
      id: 'key_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      key: cleanKey,
      isDefault: shouldBeDefault,
      addedAt: Date.now()
    };

    let updatedList = config.keysList.map(k => shouldBeDefault ? { ...k, isDefault: false } : k);
    updatedList.unshift(newKeyItem);

    const updatedConfig: GroqConfig = {
      ...config,
      apiKey: shouldBeDefault ? cleanKey : (config.apiKey || cleanKey),
      keysList: updatedList
    };

    this.saveConfig(updatedConfig);
    return newKeyItem;
  },

  setDefaultKey(id: string): void {
    const config = this.getConfig();
    const target = config.keysList.find(k => k.id === id);
    if (!target) return;

    const updatedList = config.keysList.map(k => ({
      ...k,
      isDefault: k.id === id
    }));

    this.saveConfig({
      ...config,
      apiKey: target.key,
      keysList: updatedList
    });
  },

  updateKey(id: string, name: string, key: string): void {
    const config = this.getConfig();
    const cleanKey = key.trim();
    const cleanName = name.trim() || 'Groq Key';

    const updatedList = config.keysList.map(k => {
      if (k.id === id) {
        return { ...k, name: cleanName, key: cleanKey };
      }
      return k;
    });

    const activeItem = updatedList.find(k => k.isDefault) || updatedList[0];

    this.saveConfig({
      ...config,
      apiKey: activeItem ? activeItem.key : '',
      keysList: updatedList
    });
  },

  deleteKey(id: string): void {
    const config = this.getConfig();
    const updatedList = config.keysList.filter(k => k.id !== id);
    let newDefaultKey = '';

    if (updatedList.length > 0) {
      if (!updatedList.some(k => k.isDefault)) {
        updatedList[0].isDefault = true;
      }
      const def = updatedList.find(k => k.isDefault);
      newDefaultKey = def ? def.key : updatedList[0].key;
    }

    this.saveConfig({
      ...config,
      apiKey: newDefaultKey,
      keysList: updatedList
    });
  },

  async fetchAvailableModels(apiKey: string): Promise<Array<{ id: string; name: string; desc?: string }>> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('Please provide an API key to fetch models.');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status}: Failed to authenticate with Groq.`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawModels: Array<{ id: string; owned_by?: string }> = Array.isArray(data?.data) ? data.data : [];

      // Filter and sort relevant chat models
      const chatModels = rawModels
        .filter(m => {
          const id = m.id.toLowerCase();
          return !id.includes('whisper') && !id.includes('tts') && !id.includes('audio');
        })
        .map(m => {
          const id = m.id;
          let friendlyName = id;
          let desc = 'Groq cloud model';

          if (id.includes('llama-3.3-70b')) {
            friendlyName = 'Llama 3.3 70B Versatile';
            desc = 'High intelligence, top SQL accuracy (Recommended)';
          } else if (id.includes('llama-3.1-8b')) {
            friendlyName = 'Llama 3.1 8B Instant';
            desc = 'Ultra-low latency, blazing fast';
          } else if (id.includes('deepseek-r1')) {
            friendlyName = 'DeepSeek R1 Distill 70B';
            desc = 'Deep mathematical & analytical reasoning';
          } else if (id.includes('mixtral')) {
            friendlyName = 'Mixtral 8x7B (32k)';
            desc = 'Large context window';
          } else if (id.includes('gemma2')) {
            friendlyName = 'Gemma 2 9B IT';
            desc = 'Google compact instruction model';
          } else if (id.includes('qwen')) {
            friendlyName = id;
            desc = 'Qwen reasoning model';
          }

          return { id, name: friendlyName, desc };
        });

      return chatModels.length > 0 ? chatModels : DEFAULT_GROQ_MODELS;
    } catch (err: any) {
      console.warn('Error fetching live models, falling back to default list', err);
      throw err;
    }
  },

  async testApiKey(apiKey: string): Promise<{ success: boolean; models?: Array<{ id: string; name: string; desc?: string }>; error?: string }> {
    try {
      const models = await this.fetchAvailableModels(apiKey);
      return { success: true, models };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Something went wrong connecting to Groq API.' };
    }
  },

  async sendChatMessage(
    messages: ChatMessage[],
    newContexts: AttachedContext[] | undefined,
    config: GroqConfig
  ): Promise<string> {
    const keyToUse = config.apiKey || this.getConfig().apiKey;
    if (!keyToUse || !keyToUse.trim()) {
      throw new Error('Groq API Key is not configured. Please add your key first.');
    }

    const systemPrompt = `You are an expert SQL and PostgreSQL assistant embedded in QuickSQL (Light, fast, and smooth SQL workspace).
Your role:
1. Help users write, debug, explain, optimize SQL queries, and manage their workspace files and folders.
2. If the user attaches their working file or query using the safety pin / plus (+) button:
   - Carefully review the attached code and requirements.
   - When proposing changes or fixes to their attached working file, use an [ACTION:EDIT_FILE] block. The user can then click to apply the changes to their working file or generate a new file instead!
   - You can also suggest creating new files, subfolders, or renaming files/folders when helpful.

3. WORKSPACE ACTION BLOCKS (You can suggest file, folder, and edit operations for the user to approve):
   - To suggest edits/updates to the user's working file:
     [ACTION:EDIT_FILE]
     file: <filename or "active">
     description: <brief explanation of changes>
     content:
     <full updated SQL query>
     [/ACTION:EDIT_FILE]

   - To propose creating a new query file in the workspace or subfolder:
     [ACTION:CREATE_FILE]
     name: <filename.sql>
     folder: <optional subfolder name, e.g. "analytics" or leave blank>
     description: <brief explanation>
     content:
     <SQL query code>
     [/ACTION:CREATE_FILE]

   - To propose creating a new subfolder in the workspace:
     [ACTION:CREATE_FOLDER]
     name: <subfolder name>
     [/ACTION:CREATE_FOLDER]

   - To propose renaming a query file or subfolder:
     [ACTION:RENAME_FILE]
     oldName: <existing name>
     newName: <new name.sql>
     [/ACTION:RENAME_FILE]

     [ACTION:RENAME_FOLDER]
     oldName: <existing folder>
     newName: <new folder name>
     [/ACTION:RENAME_FOLDER]

4. CRITICAL RULE FOR STANDALONE SQL CODE:
   Whenever you propose a general SQL query outside of an ACTION block, wrap the executable SQL code inside √ signs on their own lines:
   √
   SELECT * FROM customers WHERE country = 'Germany';
   √
   This enables the "Click to Use" and "Run" buttons in the user's workspace.
5. Keep explanations concise, practical, and clear.`;

    const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      let formattedContent = m.content;

      if (m.attachedContexts && m.attachedContexts.length > 0) {
        const contextText = m.attachedContexts
          .map(ctx => `=== Context: ${ctx.title} (${ctx.type}) ===\n${ctx.content}`)
          .join('\n\n');

        formattedContent = `[ATTACHED CONTEXT DATA]\n${contextText}\n[/ATTACHED CONTEXT DATA]\n\n${m.content}`;
      }

      apiMessages.push({
        role: m.role as 'user' | 'assistant',
        content: formattedContent
      });
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${keyToUse.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages: apiMessages,
          temperature: config.temperature ?? 0.2,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Groq API Error (${response.status})`;
        throw new Error(msg);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error('Received empty response from Groq API.');
      }

      return reply;
    } catch (err: any) {
      console.error('Groq API request error:', err);
      throw err;
    }
  }
};
