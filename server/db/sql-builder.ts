import { query, queryOne, querySingle, queryCount } from './query'
import type { QueryResultRow } from 'pg'

type Primitive = string | number | boolean | null

export interface OrderSpec {
  column: string
  ascending?: boolean
  nullsFirst?: boolean
}

export class SqlBuilder {
  private readonly table: string
  private selectClause = '*'
  private readonly whereParts: string[] = []
  private readonly params: unknown[] = []
  private readonly orderParts: string[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null

  constructor(table: string) {
    this.table = table
  }

  private placeholder(value: unknown): string {
    this.params.push(value)
    return `$${this.params.length}`
  }

  private quoteIdent(identifier: string): string {
    return identifier
      .split('.')
      .map((part) => {
        if (part === '*') return part
        return `"${part.replace(/"/g, '""')}"`
      })
      .join('.')
  }

  select(columns: string): this {
    this.selectClause = columns
    return this
  }

  eq(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} = ${this.placeholder(value)}`)
    return this
  }

  neq(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} <> ${this.placeholder(value)}`)
    return this
  }

  gt(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} > ${this.placeholder(value)}`)
    return this
  }

  gte(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} >= ${this.placeholder(value)}`)
    return this
  }

  lt(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} < ${this.placeholder(value)}`)
    return this
  }

  lte(column: string, value: Primitive): this {
    this.whereParts.push(`${this.quoteIdent(column)} <= ${this.placeholder(value)}`)
    return this
  }

  like(column: string, pattern: string): this {
    this.whereParts.push(`${this.quoteIdent(column)} LIKE ${this.placeholder(pattern)}`)
    return this
  }

  ilike(column: string, pattern: string): this {
    this.whereParts.push(`${this.quoteIdent(column)} ILIKE ${this.placeholder(pattern)}`)
    return this
  }

  in(column: string, values: ReadonlyArray<Primitive>): this {
    if (values.length === 0) {
      this.whereParts.push('false')
      return this
    }
    const placeholders = values.map((v) => this.placeholder(v)).join(', ')
    this.whereParts.push(`${this.quoteIdent(column)} IN (${placeholders})`)
    return this
  }

  is(column: string, value: null | boolean): this {
    if (value === null) {
      this.whereParts.push(`${this.quoteIdent(column)} IS NULL`)
    } else {
      this.whereParts.push(`${this.quoteIdent(column)} IS ${value ? 'TRUE' : 'FALSE'}`)
    }
    return this
  }

  isNotNull(column: string): this {
    this.whereParts.push(`${this.quoteIdent(column)} IS NOT NULL`)
    return this
  }

  rawWhere(sql: string, params: ReadonlyArray<unknown> = []): this {
    let rendered = sql
    for (const p of params) {
      rendered = rendered.replace('?', this.placeholder(p))
    }
    this.whereParts.push(`(${rendered})`)
    return this
  }

  or(conditions: ReadonlyArray<OrCondition>): this {
    if (conditions.length === 0) return this
    const parts = conditions.map((cond) => this.renderOrCondition(cond))
    this.whereParts.push(`(${parts.join(' OR ')})`)
    return this
  }

  private renderOrCondition(cond: OrCondition): string {
    const col = this.quoteIdent(cond.column)
    switch (cond.op) {
      case 'eq':
        return `${col} = ${this.placeholder(cond.value)}`
      case 'neq':
        return `${col} <> ${this.placeholder(cond.value)}`
      case 'gt':
        return `${col} > ${this.placeholder(cond.value)}`
      case 'gte':
        return `${col} >= ${this.placeholder(cond.value)}`
      case 'lt':
        return `${col} < ${this.placeholder(cond.value)}`
      case 'lte':
        return `${col} <= ${this.placeholder(cond.value)}`
      case 'like':
        return `${col} LIKE ${this.placeholder(cond.value)}`
      case 'ilike':
        return `${col} ILIKE ${this.placeholder(cond.value)}`
      case 'is':
        if (cond.value === null) return `${col} IS NULL`
        return `${col} IS ${cond.value ? 'TRUE' : 'FALSE'}`
      default:
        throw new Error(`Unsupported OR operator: ${(cond as { op: string }).op}`)
    }
  }

  order(spec: OrderSpec): this {
    const direction = spec.ascending === false ? 'DESC' : 'ASC'
    const nulls =
      spec.nullsFirst === undefined
        ? ''
        : spec.nullsFirst
          ? ' NULLS FIRST'
          : ' NULLS LAST'
    this.orderParts.push(`${this.quoteIdent(spec.column)} ${direction}${nulls}`)
    return this
  }

  limit(value: number): this {
    this.limitValue = value
    return this
  }

  offset(value: number): this {
    this.offsetValue = value
    return this
  }

  range(from: number, to: number): this {
    this.offsetValue = from
    this.limitValue = to - from + 1
    return this
  }

  private buildWhere(): string {
    if (this.whereParts.length === 0) return ''
    return ` WHERE ${this.whereParts.join(' AND ')}`
  }

  private buildSelectText(): string {
    let text = `SELECT ${this.selectClause} FROM ${this.quoteIdent(this.table)}`
    text += this.buildWhere()
    if (this.orderParts.length > 0) {
      text += ` ORDER BY ${this.orderParts.join(', ')}`
    }
    if (this.limitValue !== null) {
      text += ` LIMIT ${this.placeholder(this.limitValue)}`
    }
    if (this.offsetValue !== null) {
      text += ` OFFSET ${this.placeholder(this.offsetValue)}`
    }
    return text
  }

  async list<T extends QueryResultRow = QueryResultRow>(): Promise<T[]> {
    return query<T>(this.buildSelectText(), this.params)
  }

  async maybeSingle<T extends QueryResultRow = QueryResultRow>(): Promise<T | null> {
    return queryOne<T>(this.buildSelectText(), this.params)
  }

  async single<T extends QueryResultRow = QueryResultRow>(): Promise<T> {
    return querySingle<T>(this.buildSelectText(), this.params)
  }

  async count(): Promise<number> {
    const text = `SELECT count(*)::int AS count FROM ${this.quoteIdent(this.table)}${this.buildWhere()}`
    return queryCount(text, this.params)
  }
}

export type OrOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'

export interface OrCondition {
  column: string
  op: OrOperator
  value: Primitive
}

export function from(table: string): SqlBuilder {
  return new SqlBuilder(table)
}
