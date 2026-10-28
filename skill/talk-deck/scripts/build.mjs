#!/usr/bin/env node
// talk.json → 발표 HTML 한 장.
//   node build.mjs --talk talk.json [--theme paper|midnight|botanical|pop|minimal] [--screenshot dash.png] [--out deck.html]
//   node build.mjs --talk talk.json --all-themes <dir>     # 테마 5종 미리보기를 한 번에
// 비밀값처럼 보이는 글이 있으면 만들지 않는다. 비어 있는 장은 자동으로 빠진다.
import fs from 'node:fs'
import path from 'node:path'
import { renderDeck, buildSlides } from './lib/render.mjs'
import { THEMES, THEME_KEYS } from './lib/themes.mjs'

const SECRET = /(sk-[a-z0-9]{8,}|ghp_[a-z0-9]{10,}|xox[abp]-[a-z0-9-]{10,}|rap_s\d+_[a-z0-9]{6,}|bearer\s+[a-z0-9._-]{12,}|(?:password|passwd|secret|api[_ -]?key|token)\s*[:=]\s*\S{6,})/i
const MAX_SHOT = 4 * 1024 * 1024

function fail(message) { console.error(`talk-deck build: ${message}`); process.exit(1) }

export function validate(talk) {
  const problems = []
  const warnings = []
  if (!talk || typeof talk !== 'object' || talk.version !== 1) problems.push('talk.version must be 1')
  if (!String(talk?.title || '').trim()) problems.push('title 이 비어 있어요')
  if (!String(talk?.presenter?.name || '').trim()) problems.push('presenter.name 이 비어 있어요')
  if (talk?.theme && !THEME_KEYS.includes(talk.theme)) problems.push(`theme 은 ${THEME_KEYS.join(', ')} 중 하나`)
  const text = JSON.stringify({ ...talk, dashboard: { ...(talk?.dashboard || {}), screenshot: undefined } })
  if (SECRET.test(text)) problems.push('비밀값(토큰·비밀번호)처럼 보이는 글이 있어요 — 지우고 다시 만드세요')
  if (!talk?.members?.list?.length) warnings.push('② 팀 멤버가 비어 있어요 (총괄 1명이라도 넣으세요)')
  if (!talk?.dashboard) warnings.push('③ 대시보드 장이 없어요')
  if (!String(talk?.feelings?.headline || '').trim()) warnings.push('④ 소감 한 문장이 비어 있어요 — 꼭 본인 말로 받아 넣으세요')
  return { problems, warnings }
}

function parseArgs(argv) {
  const o = { talk: null, theme: null, out: null, screenshot: null, allThemes: null }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]; const value = argv[++i]
    if (value === undefined) fail(`${flag} needs a value`)
    if (flag === '--talk') o.talk = value
    else if (flag === '--theme') o.theme = value
    else if (flag === '--out') o.out = value
    else if (flag === '--screenshot') o.screenshot = value
    else if (flag === '--all-themes') o.allThemes = value
    else fail(`unknown option: ${flag}`)
  }
  if (!o.talk) fail('usage: build.mjs --talk talk.json [--theme <key>] [--screenshot png] [--out deck.html] | --all-themes <dir>')
  return o
}

function embedShot(file) {
  const stat = fs.statSync(file)
  if (stat.size > MAX_SHOT) fail(`screenshot is ${Math.round(stat.size / 1024)}KB — 4MB 이하로 줄여 주세요`)
  const ext = path.extname(file).toLowerCase()
  const type = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : fail('screenshot must be png/jpg/webp')
  return `data:${type};base64,${fs.readFileSync(file).toString('base64')}`
}

function main() {
  const o = parseArgs(process.argv.slice(2))
  let talk
  try { talk = JSON.parse(fs.readFileSync(o.talk, 'utf8')) } catch (error) { fail(`cannot read ${o.talk}: ${error.message}`) }
  if (o.theme) talk.theme = o.theme
  if (o.screenshot) talk.dashboard = { ...(talk.dashboard || {}), screenshot: embedShot(o.screenshot) }
  const { problems, warnings } = validate(talk)
  if (problems.length) fail(problems.join('\n  '))
  const keys = o.allThemes ? THEME_KEYS : [talk.theme || 'botanical']
  const written = []
  for (const key of keys) {
    const out = o.allThemes ? path.join(o.allThemes, `deck-${key}.html`) : (o.out || path.join(path.dirname(o.talk), 'deck.html'))
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, renderDeck(talk, key), 'utf8')
    written.push({ theme: key, label: THEMES[key].label, file: out, bytes: fs.statSync(out).size })
  }
  console.log(JSON.stringify({ ok: true, slides: buildSlides(talk).map(s => s.match(/data-key="([^"]+)"/)[1]), written, warnings }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
