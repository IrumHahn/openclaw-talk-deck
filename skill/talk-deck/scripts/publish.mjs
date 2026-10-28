#!/usr/bin/env node
// 발표 HTML 을 베이스캠프 발표장에 올린다. 같은 주차에 다시 올리면 덮어쓴다(수정 가능).
//   node publish.mjs --deck deck.html --title "제목" --theme botanical [--week 1] [--name 베이스캠프명단이름] [--dry-run]
// 누구인지: ① 이름(--name, 베이스캠프 명단의 이름) — 기본. 처음 올리면 서버가 수정 열쇠를 주고
//              ~/.config/run-academy/talk.json 에 저장한다(다음부터 이름·열쇠 자동). 열쇠가 있어야 덮어쓸 수 있다.
//           ② 광장 토큰(rap_s4_…)이 있으면 그걸 쓴다: 환경변수 RUN_ACADEMY_PLAZA_TOKEN → --token-file
//              → ~/.config/run-academy/plaza-token → ~/.run-academy/plaza/plaza.env. 토큰·열쇠는 출력하지 않는다.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MAX = 6 * 1024 * 1024
function fail(message, code = 1) { console.error(`talk-deck publish: ${message}`); process.exit(code) }

function parseArgs(argv) {
  const o = { deck: null, title: null, theme: null, week: 1, presenter: null, name: null, cohort: 's4', base: process.env.RUN_ACADEMY_BASE || 'https://run-academy.pages.dev', tokenFile: null, dryRun: false }
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
    else if (flag === '--name') o.name = value
    else if (flag === '--cohort') o.cohort = value
    else if (flag === '--base') o.base = value.replace(/\/+$/, '')
    else if (flag === '--token-file') o.tokenFile = value
    else fail(`unknown option: ${flag}`)
  }
  if (!o.deck || !o.title) fail('usage: publish.mjs --deck deck.html --title "제목" [--theme key] [--week 1] [--name 명단이름] [--dry-run]')
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
  const home = os.homedir()
  const readToken = file => { try { return fs.readFileSync(file, 'utf8') } catch { return '' } }
  // 광장 스킬 설치 프롬프트가 만든 ~/.run-academy/plaza/plaza.env (RUN_ACADEMY_PLAZA_TOKEN=…) 도 읽는다.
  const plazaEnv = (readToken(path.join(home, '.run-academy', 'plaza', 'plaza.env')).match(/^\s*(?:export\s+)?RUN_ACADEMY_PLAZA_TOKEN\s*=\s*["']?(rap_[a-z0-9_]+)/m) || [])[1] || ''
  const token = (process.env.RUN_ACADEMY_PLAZA_TOKEN || (o.tokenFile ? readToken(o.tokenFile) : '') || readToken(path.join(home, '.config', 'run-academy', 'plaza-token')) || plazaEnv).trim()
  const savedFile = path.join(home, '.config', 'run-academy', 'talk.json')
  let saved = {}
  try { saved = JSON.parse(fs.readFileSync(savedFile, 'utf8')) } catch { saved = {} }
  const mine = saved[o.cohort] || {}
  const name = (o.name || mine.name || '').trim()
  if (!token && !name) fail('누가 올리는지 몰라요: --name "<베이스캠프 명단의 이름>" 을 주세요', 2)
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }
  const payload = token ? body : { ...body, cohort: o.cohort, name, ...(mine.editKey && (!mine.name || mine.name === name) ? { editKey: mine.editKey } : {}) }
  let res
  try {
    res = await fetch(`${o.base}/api/talk-deck`, { method: 'POST', headers, body: JSON.stringify(payload) })
  } catch (error) { fail(`network error: ${error.message}`, 3) }
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* non-JSON */ }
  if (!res.ok || !data?.ok) {
    const msg = `server ${res.status}: ${(data && (data.error || data.message)) || text.slice(0, 200)}`
    fail(msg, res.status === 404 ? 6 : res.status === 401 || res.status === 403 ? 4 : 5)
  }
  if (!token && data.editKey) {
    fs.mkdirSync(path.dirname(savedFile), { recursive: true, mode: 0o700 })
    saved[o.cohort] = { name, editKey: data.editKey, id: data.id }
    fs.writeFileSync(savedFile, JSON.stringify(saved, null, 2), { mode: 0o600 })
  } else if (!token && !mine.name) {
    saved[o.cohort] = { ...mine, name }
    fs.mkdirSync(path.dirname(savedFile), { recursive: true, mode: 0o700 })
    fs.writeFileSync(savedFile, JSON.stringify(saved, null, 2), { mode: 0o600 })
  }
  console.log(JSON.stringify({ ok: true, url: data.url, galleryUrl: data.galleryUrl, bytes, via: token ? 'plaza-token' : 'name', presenter: name || undefined, editKeySaved: Boolean(!token && data.editKey) }, null, 2))
}

main()
