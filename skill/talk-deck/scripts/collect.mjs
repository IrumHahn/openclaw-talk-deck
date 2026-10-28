#!/usr/bin/env node
// 1주차 재료를 찾아 발표 초안(talk.json)을 만든다. 사람만 답할 수 있는 칸은 비워 두고 ask 목록으로 알려 준다.
//   node collect.mjs [--root <dir> ...] [--out talk/talk.json] [--week 1]
// 찾는 것: my-work-map.md · team.json · team.md · 대시보드 config.json/seed.json · USER.md
// 기본 탐색 위치: $OPENCLAW_WORKSPACE, ~/.openclaw/workspace, /data/.openclaw/workspace, ~/.openclaw (깊이 4)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MENU_LABELS = { tasks: '업무현황', proposals: '업무제안', agents: '팀관리', operations: '운영현황', sessions: '세션관제', console: 'AI OS 관제실', bizkakao: '비즈카톡', kakao: '카톡관리', email: '이메일', calls: '전화하기', contacts: '인맥관리', post: '우체국', meetingroom: '회의실', dispatch: '특별 발송반', orders: '주문관리', coupang: '쿠팡 주문', sourcing: '쇼핑몰 매물조사', school: '실행학교', coupons: '쿠폰관리', projects: '프로젝트 허브', youtube: '유튜브', ideas: '글감실', news: '최신정보', landing: '랜딩페이지', meetings: '미팅기록', notes: '나의 메모', plaud: 'Plaud 분류 검토', books: '읽은 책', notebooks: '노트북LM', settings: '설정' }
const STATUS = { open: '대기', working: '진행 중', waiting: '검토 대기', done: '완료', rejected: '보류' }
const SKIP = new Set(['node_modules', '.git', 'sessions', 'agents', 'media', 'logs', 'browser', 'cache', '.cache'])

function parseArgs(argv) {
  const o = { roots: [], out: path.join(process.cwd(), 'talk', 'talk.json'), week: 1 }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]; const value = argv[++i]
    if (value === undefined) throw new Error(`${flag} needs a value`)
    if (flag === '--root') o.roots.push(value)
    else if (flag === '--out') o.out = value
    else if (flag === '--week') o.week = Number(value)
    else throw new Error(`unknown option: ${flag}`)
  }
  if (!o.roots.length) {
    const home = os.homedir()
    o.roots = [process.env.OPENCLAW_WORKSPACE, path.join(home, '.openclaw', 'workspace'), '/data/.openclaw/workspace', path.join(home, '.openclaw'), '/data/.openclaw'].filter(Boolean)
  }
  return o
}

export function findFiles(roots, maxDepth = 4) {
  const hits = {}
  const want = new Set(['my-work-map.md', 'team.json', 'team.md', 'config.json', 'seed.json', 'USER.md'])
  const seen = new Set()
  function walk(dir, depth) {
    let real
    try { real = fs.realpathSync(dir) } catch { return }
    if (seen.has(real) || depth > maxDepth) return
    seen.add(real)
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.') ) walk(p, depth + 1); continue }
      if (!want.has(e.name)) continue
      if ((e.name === 'config.json' || e.name === 'seed.json') && path.basename(dir) !== 'dashboard') continue
      let mtime = 0
      try { mtime = fs.statSync(p).mtimeMs } catch { continue }
      ;(hits[e.name] ||= []).push({ path: p, mtime })
    }
  }
  for (const r of roots) if (r && fs.existsSync(r)) walk(r, 0)
  const pick = name => (hits[name] || []).sort((a, b) => b.mtime - a.mtime)[0]?.path || null
  return { workMap: pick('my-work-map.md'), teamJson: pick('team.json'), teamMd: pick('team.md'), dashConfig: pick('config.json'), dashSeed: pick('seed.json'), user: pick('USER.md') }
}

const readText = file => { try { return file ? fs.readFileSync(file, 'utf8') : '' } catch { return '' } }
const readJson = file => { try { return file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null } catch { return null } }

// 마크다운 표에서 업무 행을 뽑는다. 머리글 낱말로 칸을 맞춘다(업무/빈도/시간/위임).
export function parseWorkMap(md) {
  const rows = []
  const lines = md.split('\n')
  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue
    const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/\*\*/g, ''))
    const header = cells(lines[i])
    const col = re => header.findIndex(h => re.test(h))
    const c = { task: col(/업무|일|task/i), frequency: col(/빈도|주기|freq/i), duration: col(/시간|소요|dur/i), delegation: col(/위임|희망|맡기/i) }
    if (c.task < 0) continue
    for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j += 1) {
      const r = cells(lines[j])
      const d = c.delegation >= 0 ? Number((r[c.delegation] || '').match(/[1-5]/)?.[0]) : NaN
      if (!r[c.task]) continue
      rows.push({ task: r[c.task], frequency: c.frequency >= 0 ? r[c.frequency] : '', duration: c.duration >= 0 ? r[c.duration] : '', delegation: Number.isFinite(d) ? d : '', owner: '' })
    }
    if (rows.length) break
  }
  rows.sort((a, b) => (Number(b.delegation) || 0) - (Number(a.delegation) || 0))
  const never = (md.match(/절대[^\n]*?(?:맡기[^\n]*?)?[:：]\s*([^\n]+)/) || [])[1] || ''
  const userName = (md.match(/^#\s*(.+?)(?:의)?\s*업무\s*지도/m) || [])[1] || ''
  return { rows, never: never.trim(), userName: userName.trim() }
}

export function dashboardMini(config, seed, agentNames = {}) {
  if (!config || !Array.isArray(config.menus)) return null
  const records = seed?.records || {}
  const custom = Array.isArray(config.customMenus) ? config.customMenus : []
  const customByKey = Object.fromEntries(custom.map(m => [m.key, m]))
  const label = key => customByKey[key]?.label || MENU_LABELS[key] || key
  const owner = key => agentNames[(config.menus.find(m => m.key === key) || {}).owner] || ''
  const open = key => (records[key] || []).filter(r => !['done', 'rejected'].includes(r.status)).length
  const keys = config.menus.map(m => m.key)
  const customKeys = keys.filter(k => customByKey[k])
  const baseKeys = keys.filter(k => !customByKey[k])
  const groups = []
  if (customKeys.length) groups.push({ label: '내 업무', items: customKeys.map(k => ({ label: label(k), owner: owner(k) })) })
  if (baseKeys.length) groups.push({ label: '기본 메뉴', items: baseKeys.map(k => ({ label: label(k), owner: owner(k) })) })
  const tiles = [...customKeys, ...baseKeys].slice(0, 6).map(k => ({ label: label(k), sub: `${open(k)}건 진행 중${owner(k) ? ' · ' + owner(k) : ''}` }))
  let widget = null
  const kanban = custom.find(m => m.kanban) || custom[0]
  if (config.widget || kanban) {
    const items = kanban ? records[kanban.key] || [] : []
    const labels = { ...STATUS, ...(kanban?.statusLabels || {}) }
    const left = items.filter(r => !['done', 'rejected'].includes(r.status))
      .sort((a, b) => String(a.dueAt || a.date || '~').localeCompare(String(b.dueAt || b.date || '~')))
    const when = r => { const v = r.dueAt || r.date; if (!v) return ''; const m = String(v).match(/T(\d{2}:\d{2})/); return m ? m[1] : String(v).slice(5, 10) }
    widget = {
      title: config.widget?.title || (kanban ? `${kanban.label} 한눈에` : '나의 위젯'),
      bigLabel: kanban ? `${kanban.label} · 남은 일` : '',
      bigValue: kanban ? `${left.length}건` : '',
      sub: left[0] ? `가장 먼저: ${left[0].title}${when(left[0]) ? ' · ' + when(left[0]) : ''}` : '',
      bars: kanban ? ['open', 'working', 'waiting', 'done'].map(s => ({ label: labels[s], value: items.filter(r => (r.status || 'open') === s).length })) : [],
      list: left.slice(0, 4).map(r => ({ title: r.title, meta: [when(r), labels[r.status || 'open']].filter(Boolean).join(' · ') })),
    }
  }
  return { name: config.name || '내 AI 오피스', emoji: config.theme?.emoji || '', tagline: config.theme?.tagline || '', groups, tiles, widget }
}

export function draftTalk({ files, week = 1, today = new Date() }) {
  const team = readJson(files.teamJson)
  const agents = Array.isArray(team?.agents) ? team.agents : []
  const names = Object.fromEntries(agents.map(a => [a.id, a.name]))
  const lead = agents.find(a => a.coordinator) || agents[0]
  const specs = agents.filter(a => a !== lead)
  const wm = parseWorkMap(readText(files.workMap))
  const config = readJson(files.dashConfig)
  const seed = readJson(files.dashSeed)
  const mini = dashboardMini(config, seed, names)
  const userMd = readText(files.user)
  const userName = wm.userName || (userMd.match(/(?:이름|Name|호칭)\s*[:：]\s*([^\n]+)/i) || [])[1]?.trim() || ''
  const customs = Array.isArray(config?.customMenus) ? config.customMenus : []
  const callouts = []
  if (customs.length) callouts.push({ title: '내 업무 메뉴', text: `${customs.map(m => `"${m.label}"`).join(', ')} — 왜 이 이름으로 지었나요? (내 말로 한 줄)` })
  if (config?.widget || mini?.widget) callouts.push({ title: '나의 위젯', text: `알고 싶은 숫자: ${mini?.widget?.bigLabel || '(?)'}\n보고 할 행동: (?)` })
  if (config?.theme?.tagline) callouts.push({ title: '홈 한 줄', text: `"${config.theme.tagline}" — 이 팀을 만든 이유` })
  const talk = {
    version: 1, week, theme: '', course: 'AI 에이전트 실전 1기',
    date: new Date(today.getTime() + 86400000).toISOString().slice(0, 10),
    title: '', subtitle: '',
    presenter: { name: userName, about: team?.team?.organization || '' },
    workMap: { headline: '', rows: wm.rows.slice(0, 5).map(r => ({ ...r, owner: '' })), never: wm.never },
    structure: { headline: '', me: '방향 정하고 승인', coordinator: lead ? { name: lead.name, role: lead.mission || lead.role, emoji: lead.emoji || '' } : {}, specialists: specs.map(a => ({ name: a.name, role: a.mission || a.role, emoji: a.emoji || '' })), base: '바탕: 내 VPS(오픈클로) · 내 PC(노드 연결) · HIA 기록', permissions: { auto: [], approve: [], never: [] } },
    members: { headline: '', list: agents.map(a => ({ name: a.name, emoji: a.emoji || '', kind: a === lead ? '총괄' : '전문가', role: a.role || '', relation: '', tone: '', dislike: '', firstTask: a.firstTasks?.[0]?.task || '' })) },
    selfIntro: { quote: '', checks: [], fix: '' },
    futureTeam: { headline: '', steps: [{ when: '지금 · 1주차', title: `${agents.length}명`, desc: agents.map(a => a.name).join(' · ') }], principle: '' },
    dashboard: { headline: '', screenshot: null, mini, callouts },
    review: { headline: '', good: [], bad: [] },
    futureDashboard: { headline: '', rows: [], widgetNext: '' },
    feelings: { headline: '', stuck: '', surprise: '', nextWeek: '' },
    closing: { line: '감사합니다', ask: '' },
    notes: {},
  }
  const ask = []
  if (!talk.presenter.name) ask.push('presenter.name — 발표자 이름')
  ask.push('title — 발표 제목(기대감 있는 한 문장, 비서가 2~3안 제안 가능)')
  if (!wm.rows.length) ask.push('workMap.rows — 업무 지도를 못 찾음: 상위 업무 3개를 물어보기')
  if (!agents.length) ask.push('team — team.json 을 못 찾음: 총괄·전문가 이름과 역할을 물어보기')
  ask.push('members[].relation/tone/dislike — 각 에이전트 SOUL.md·IDENTITY.md 에서 채우고 확인받기')
  ask.push('structure.permissions — SOUL.md·AGENTS.md 의 자율/승인/금지를 옮기고 확인받기')
  ask.push('selfIntro.quote — 총괄에게 "네 소개 해줘" 한 번 묻고 3줄로 요약(선택)')
  ask.push('futureTeam.steps — 2·3·4주차에 늘리고 싶은 직원(사람에게 묻기)')
  if (!mini) ask.push('dashboard — 대시보드 config/seed 를 못 찾음: 대시보드 캡처를 받거나 장을 빼기')
  ask.push('dashboard.callouts — "왜 이 이름" "위젯 보고 할 행동"은 사람 말로')
  ask.push('review.good/bad — 며칠 써 본 좋았던 점·아쉬운 점 각 2~3개(사람에게 묻기)')
  ask.push('futureDashboard.rows — 다음에 채울 메뉴 2~4개(언제·누가)')
  ask.push('feelings.* — 소감 한 문장 + 막힌 곳·놀란 순간·다음 주에 맡길 일 (반드시 사람 말 그대로)')
  ask.push('theme — paper·midnight·botanical·pop·minimal 중 선택')
  return { talk, ask }
}

function main() {
  const o = parseArgs(process.argv.slice(2))
  const files = findFiles(o.roots)
  const { talk, ask } = draftTalk({ files, week: o.week })
  fs.mkdirSync(path.dirname(o.out), { recursive: true })
  if (fs.existsSync(o.out)) fs.copyFileSync(o.out, `${o.out}.bak-${Date.now()}`)
  fs.writeFileSync(o.out, `${JSON.stringify(talk, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ ok: true, out: o.out, found: files, counts: { workMapRows: talk.workMap.rows.length, members: talk.members.list.length, dashboard: Boolean(talk.dashboard.mini) }, ask }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
