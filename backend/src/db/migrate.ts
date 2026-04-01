import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationPath = join(__dirname, '../../infra/sql/001_initial.sql')

const sql = readFileSync(migrationPath, 'utf-8')

try {
  await pool.query(sql)
  console.log('Migration applied successfully.')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
} finally {
  await pool.end()
}
