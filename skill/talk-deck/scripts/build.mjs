#!/usr/bin/env node
// talk.json → 발표 HTML 한 장.
//   node build.mjs --talk talk.json [--theme paper|midnight|botanical|pop|minimal] [--screenshot dash.png] [--office-screenshot office.png] [--out deck.html]
//   node build.mjs --talk talk.json --all-themes <dir>     # 테마 5종 미리보기를 한 번에
// 비밀값처럼 보이는 글이 있으면 만들지 않는다. 비어 있는 장은 자동으로 빠진다.
import fs from 'node:fs'
import path from 'node:path'
import { renderDeck, buildSlides, slideTextStats } from './lib/render.mjs'
import { THEMES, THEME_KEYS } from './lib/themes.mjs'

const SECRET = /(sk-[a-z0-9]{8,}|ghp_[a-z0-9]{10,}|xox[abp]-[a-z0-9-]{10,}|rap_s\d+_[a-z0-9]{6,}|bearer\s+[a-z0-9._-]{12,}|(?:password|passwd|secret|api[_ -]?key|token)\s*[:=]\s*\S{6,})/i
const MAX_SHOT = 4 * 1024 * 1024

function fail(message) { console.error(`talk-deck build: ${message}`); process.exit(1) }

// 발표 화면에 나오면 안 되는 말 — 비서의 작업 메모·개발 용어. 청중(동기 수강생)에게 하는 말로 바꿔야 한다.
export const JARGON = [
  [/미검증|검증\s*전|미실행|실행\s*안\s*함|\(\s*미\s*[가-힣]*\)/, '"미검증·미실행" 같은 작업 상태 → "다음 주에 해 볼 거예요"처럼'],
  [/재구성|실화면|실제\s*화면\s*아님|정지\s*화면|캡처\s*아님/, '"재구성·실화면 아님" → 그냥 빼거나 "우리 사무실 모습이에요"'],
  [/등록\s*아님|제안\s*자리|실제\s*채용/, '"등록 아님·제안 자리" → "곧 올 동료"'],
  [/게시\s*전|초안\s*·|\bdraft\b/i, '"게시 전·초안" 같은 작업 표시'],
  [/동기화|로컬\s*설정|\bAPI\b|\bconfig\b|\bseed\b|\bjson\b|\bmain\b|\bnode\b|\bcron\b/i, '개발 용어(동기화·API·config·main…) → 쉬운 말로'],
  [/보존됨|상충|미지정|미배정|미확인|미정\s*\/\s*5/, '"보존됨·상충·미지정" 같은 시스템 말투 → 사람 말로'],
  [/\(\?\)|내 말로 한 줄|왜 이 이름으로 지었나요/, '아직 안 채운 자리(초안 질문)가 남아 있어요 — 사람 답으로 바꾸세요'],
]
const SKIP_KEYS = new Set(['notes', 'screenshot', 'theme', 'version', 'week', 'date', 'sprite', 'template', 'course'])
function scanText(node, pathName, out) {
  if (node == null) return
  if (typeof node === 'string') { out.push([pathName, node]); return }
  if (Array.isArray(node)) { node.forEach((v, i) => scanText(v, `${pathName}[${i}]`, out)); return }
  if (typeof node === 'object') for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) scanText(v, pathName ? `${pathName}.${k}` : k, out)
}
// 장마다 최소 글자 수(화면에 보이는 글) — 이보다 적으면 빈약하다고 알려 준다.
export const MIN_CHARS = { motivation: 70, workmap: 120, structure: 150, members: 160, futureteam: 110, dashboard: 140, review: 90, futuredash: 90, office: 120, officeteam: 90, feelings: 90, goal: 70, pledge: 70 }

export function validate(talk) {
  const problems = []
  const warnings = []
  if (!talk || typeof talk !== 'object' || talk.version !== 1) problems.push('talk.version must be 1')
  if (!String(talk?.title || '').trim()) problems.push('title 이 비어 있어요')
  if (!String(talk?.presenter?.name || '').trim()) problems.push('presenter.name 이 비어 있어요')
  if (talk?.theme && !THEME_KEYS.includes(talk.theme)) problems.push(`theme 은 ${THEME_KEYS.join(', ')} 중 하나`)
  const text = JSON.stringify({ ...talk, dashboard: { ...(talk?.dashboard || {}), screenshot: undefined }, office: { ...(talk?.office || {}), screenshot: undefined } })
  if (SECRET.test(text)) problems.push('비밀값(토큰·비밀번호)처럼 보이는 글이 있어요 — 지우고 다시 만드세요')
  const texts = []
  scanText(talk, '', texts)
  for (const [where, value] of texts) for (const [re, hint] of JARGON) {
    const m = String(value).match(re)
    if (m) problems.push(`발표에 쓰면 안 되는 말 「${m[0]}」 (${where}) — ${hint}`)
  }
  for (const m of (talk?.members?.list || [])) if (/^[a-z0-9_-]+$/.test(String(m.name || ''))) problems.push(`멤버 이름이 영문 id 예요(${m.name}) — 화면 이름(한글)으로`)
  if (!talk?.members?.list?.length) warnings.push('② 팀 멤버가 비어 있어요 (총괄 1명이라도 넣으세요)')
  if (!String(talk?.feelings?.headline || '').trim()) warnings.push('④ 소감 한 문장이 비어 있어요 — 꼭 본인 말로 받아 넣으세요')
  if (!String(talk?.motivation?.headline || '').trim()) warnings.push('참여 동기가 비어 있어요')
  if (!String(talk?.goal?.headline || '').trim()) warnings.push('한 달 뒤 완성하고 싶은 것이 비어 있어요')
  if (!String(talk?.pledge?.declaration || '').trim()) warnings.push('다짐과 선언이 비어 있어요')
  if (talk?.office?.template && !['diorama', 'saas', 'rpg', 'control', 'building'].includes(talk.office.template)) problems.push('office.template 은 diorama·saas·rpg·control·building 중 하나')
  let thin = []
  if (!problems.length) {
    thin = slideTextStats(talk).filter(s => MIN_CHARS[s.key] && s.chars < MIN_CHARS[s.key]).map(s => ({ key: s.key, chars: s.chars, min: MIN_CHARS[s.key] }))
  }
  return { problems, warnings, thin }
}

function parseArgs(argv) {
  const o = { talk: null, theme: null, out: null, screenshot: null, officeShot: null, allThemes: null }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]; const value = argv[++i]
    if (value === undefined) fail(`${flag} needs a value`)
    if (flag === '--talk') o.talk = value
    else if (flag === '--theme') o.theme = value
    else if (flag === '--out') o.out = value
    else if (flag === '--screenshot') o.screenshot = value
    else if (flag === '--office-screenshot') o.officeShot = value
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
  if (o.officeShot) talk.office = { ...(talk.office || {}), screenshot: embedShot(o.officeShot) }
  const { problems, warnings, thin } = validate(talk)
  if (problems.length) fail(problems.join('\n  '))
  const keys = o.allThemes ? THEME_KEYS : [talk.theme || 'botanical']
  const written = []
  for (const key of keys) {
    const out = o.allThemes ? path.join(o.allThemes, `deck-${key}.html`) : (o.out || path.join(path.dirname(o.talk), 'deck.html'))
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, renderDeck(talk, key), 'utf8')
    written.push({ theme: key, label: THEMES[key].label, file: out, bytes: fs.statSync(out).size })
  }
  console.log(JSON.stringify({ ok: true, slides: buildSlides(talk).map(s => s.match(/data-key="([^"]+)"/)[1]), written, warnings, thin, ...(thin.length ? { thinNote: '빈약한 장이 있어요 — 올리기 전에 질문으로 채우거나 기록으로 풀어 쓴 초안을 확인받으세요(SKILL.md 「빈약한 장 채우기」)' } : {}) }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
