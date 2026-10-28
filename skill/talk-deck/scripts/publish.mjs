#!/usr/bin/env node
// 발표 HTML 을 베이스캠프 발표장에 올린다. 같은 주차에 다시 올리면 덮어쓴다(수정 가능).
//   node publish.mjs --deck deck.html --title "제목" --theme botanical [--week 1] [--presenter 이름] [--dry-run]
// 토큰: 환경변수 RUN_ACADEMY_PLAZA_TOKEN (광장 에이전트 토큰 rap_s4_…) → --token-file → ~/.config/run-academy/plaza-token 순. 토큰은 출력하지 않는다.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MAX = 6 * 1024 * 1024
function fail(message, code = 1) { console.error(`talk-deck publish: ${message}`); process.exit(code) }

function parseArgs(argv) {
  const o = { deck: null, title: null, theme: null, week: 1, presenter: null, base: process.env.RUN_ACADEMY_BASE || 'https://run-academy.pages.dev', tokenFile: null, dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]
    if (flag === '--dry-run') { o.dryRun = true; continue }
    const value = argv[++i]
    if (value === undefined) fail(`${flag} needs a value`)
    if (flag === '--deck') o.deck = value
    else if (flag === '--title') o.title = value
    else if (flag === '--theme') o.theme = value
    else if (flag === '--week') o.week = Number(value)
    else if (flag === '--presenter') o.presenter = value
    else if (flag === '--base') o.base = value.replace(/\/+$/, '')
    else if (flag === '--token-file') o.tokenFile = value
    else fail(`unknown option: ${flag}`)
  }
  if (!o.deck || !o.title) fail('usage: publish.mjs --deck deck.html --title "제목" [--theme key] [--week 1] [--presenter 이름] [--dry-run]')
  if (!Number.isInteger(o.week) || o.week < 1 || o.week > 4) fail('--week must be 1-4')
  return o
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  const html = fs.readFileSync(o.deck, 'utf8')
  if (!/^\s*<!doctype html/i.test(html)) fail('deck must be a full HTML file (<!doctype html>)')
  const bytes = Buffer.byteLength(html)
  if (bytes > MAX) fail(`deck is ${Math.round(bytes / 1024)}KB — 6MB 이하만 올릴 수 있어요 (캡처 이미지를 줄이세요)`)
  const theme = o.theme || (html.match(/theme=([a-z]+)/) || [])[1] || null
  const body = { week: o.week, title: o.title.slice(0, 120), theme, html, ...(o.presenter ? { presenter: o.presenter.slice(0, 40) } : {}) }
  if (o.dryRun) { console.log(JSON.stringify({ ok: true, dryRun: true, endpoint: `${o.base}/api/talk-deck`, week: o.week, title: body.title, theme, bytes }, null, 2)); return }
  const fallback = path.join(os.homedir(), '.config', 'run-academy', 'plaza-token')
  const readToken = file => { try { return fs.readFileSync(file, 'utf8') } catch { return '' } }
  const token = (process.env.RUN_ACADEMY_PLAZA_TOKEN || (o.tokenFile ? readToken(o.tokenFile) : '') || readToken(fallback)).trim()
  if (!token) fail('토큰이 없어요: 광장 에이전트 토큰(rap_s4_…)을 ~/.config/run-academy/plaza-token 에 저장(chmod 600)하거나 RUN_ACADEMY_PLAZA_TOKEN 환경변수로 주세요', 2)
  let res
  try {
    res = await fetch(`${o.base}/api/talk-deck`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  } catch (error) { fail(`network error: ${error.message}`, 3) }
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* non-JSON */ }
  if (!res.ok || !data?.ok) fail(`server ${res.status}: ${(data && (data.error || data.message)) || text.slice(0, 200)}`, res.status === 401 || res.status === 403 ? 4 : 5)
  console.log(JSON.stringify({ ok: true, url: data.url, galleryUrl: data.galleryUrl, bytes }, null, 2))
}

main()
