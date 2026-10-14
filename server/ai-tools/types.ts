import { z } from 'zod'
import type { AppEnv } from '../types/hono-env'

export type AiAuth = AppEnv['Variables']['auth']

export type AiToolErrorCode =
  | 'invalid_input'
  | 'forbidden'
  | 'unknown_tool'
  | 'unauthorized'
  | 'contract_mismatch'
  | 'upstream_error'

export class AiToolError extends Error {
  constructor(
    public code: AiToolErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AiToolError'
  }
}

export type InternalGet = <S extends z.ZodType>(path: string, schema: S) => Promise<z.output<S>>

export interface AiToolContext {
  auth: AiAuth
  get: InternalGet
}

export interface AiToolOutput {
  result: unknown
  total: number
}

export interface AiTool {
  name: string
  description: string
  permissions: string[]
  inputSchema: Record<string, unknown>
  execute: (rawInput: unknown, ctx: AiToolContext) => Promise<AiToolOutput>
}

interface AiToolDefinition<I extends z.ZodType> {
  name: string
  description: string
  permissions: string[]
  input: I
  run: (input: z.output<I>, ctx: AiToolContext) => Promise<AiToolOutput>
}

export function defineTool<I extends z.ZodType>(definition: AiToolDefinition<I>): AiTool {
  const { $schema: _schema, ...inputSchema } = z.toJSONSchema(definition.input, { io: 'input' })
  return {
    name: definition.name,
    description: definition.description,
    permissions: definition.permissions,
    inputSchema,
    async execute(rawInput, ctx) {
      const parsed = definition.input.safeParse(rawInput ?? {})
      if (!parsed.success) throw new AiToolError('invalid_input', z.prettifyError(parsed.error))
      return definition.run(parsed.data, ctx)
    },
  }
}
