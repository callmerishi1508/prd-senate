import { DEFAULT_MODEL_ID, getModelProfile } from '../utils/model-profiles'

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaOptions {
  model?: string
  temperature?: number
  format?: 'json'
  num_ctx?: number
  num_predict?: number
}

import http from 'http'

export async function* streamOllamaChat(messages: OllamaMessage[], options: OllamaOptions = {}) {
  const model = options.model || DEFAULT_MODEL_ID
  const profile = getModelProfile(model)
  
  const postData = JSON.stringify({
    model,
    messages,
    stream: true,
    options: {
      temperature: options.temperature ?? 0.7,
      num_ctx: options.num_ctx,
      num_predict: options.num_predict
    },
    format: options.format
  })

  let hostname = 'localhost';
  let port = 11434;

  if (process.env.OLLAMA_BASE_URL) {
    try {
      const url = new URL(process.env.OLLAMA_BASE_URL);
      hostname = url.hostname;
      port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
    } catch (e) {
      console.error('Invalid OLLAMA_BASE_URL', e);
    }
  }

  const reqOptions = {
    hostname,
    port,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: profile.timeoutMs
  }

  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const req = http.request(reqOptions, (res) => {
      resolve(res)
    })
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('http request timeout'))
    })
    
    // Some versions of Node require explicitly disabling the socket timeout
    req.on('socket', (socket) => {
      socket.setTimeout(0)
    })

    req.write(postData)
    req.end()
  })

  if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
    throw new Error(`Ollama API error: ${response.statusCode}`)
  }

  const decoder = new TextDecoder()
  for await (const chunk of response) {
    const text = decoder.decode(chunk as Buffer, { stream: true })
    const lines = text.split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.message?.content) {
          yield json.message.content
        }
      } catch (e) {
        console.error("Error parsing Ollama chunk", e)
      }
    }
  }
}

export async function generateOllamaResponse(messages: OllamaMessage[], options: OllamaOptions = {}): Promise<string> {
  let fullContent = ''
  try {
    for await (const chunk of streamOllamaChat(messages, options)) {
      fullContent += chunk
    }
    return fullContent
  } catch (error: unknown) {
    if (error instanceof Error && error.cause) {
      const cause = error.cause as { message?: string, code?: string } | string;
      if (typeof cause === 'string') {
        throw new Error(`Ollama fetch failed: ${cause}`);
      } else {
        throw new Error(`Ollama fetch failed: ${cause.message || cause.code || String(cause)}`);
      }
    }
    throw error;
  }
}
