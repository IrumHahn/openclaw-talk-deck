import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { renderDeck, buildSlides } from '../skill/talk-deck/scripts/lib/render.mjs'
import { THEME_KEYS } from '../skill/talk-deck/scripts/lib/themes.mjs'
import { parseWorkMap, dashboardMini, findFiles, draftTalk } from '../skill/talk-deck/scripts/collect.mjs'
import { validate } from '../skill/talk-deck/scripts/build.mjs'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const scripts = path.join(root, 'skill/talk-deck/scripts')
const example = JSON.parse(fs.readFileSync(path.join(root, 'examples/flower/talk.json'), 'utf8'))

test('5 themes render a full deck with all 12 slides', () => {
  assert.equal(THEME_KEYS.length, 5)
  for (const key of THEME_KEYS) {
    const html = renderDeck(example, key)
    assert.match(html, /^<!doctype html>/)
    assert.match(html, /pretendard/i)
    assert.equal((html.match(/<section class="slide/g) || []).length, 12)
    assert.ok(!/<script src=/i.test(html), 'no external scripts (basecamp CSP)')
    assert.ok(!/localStorage|document\.cookie|fetch\(/.test(html), 'no storage or network in deck runtime')
  }
})

test('user text is escaped', () => {
  const talk = { ...example, title: '<img src=x onerror=alert(1)>', feelings: { headline: '"<b>hi</b>"' } }
  const html = renderDeck(talk, 'pop')
  assert.ok(!html.includes('<img src=x'))
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'))
})

test('empty sections are dropped', () => {
  const slides = buildSlides({ version: 1, title: 't', presenter: { name: 'a' }, members: { list: [{ name: '봄이' }] }, feelings: { headline: '좋았다' } })
  const keys = slides.map(s => s.match(/data-key="([^"]+)"/)[1])
  assert.deepEqual(keys, ['cover', 'agenda', 'members', 'feelings', 'closing'])
})

test('validate blocks secrets and missing title', () => {
  assert.ok(validate({ version: 1, presenter: { name: 'a' } }).problems.length)
  const r = validate({ ...example, subtitle: 'token: abcdefghijk' })
  assert.ok(r.problems.some(p => p.includes('비밀값')))
  assert.ok(validate({ ...example, subtitle: 'rap_s4_abcdef123' }).problems.length)
  assert.equal(validate(example).problems.length, 0)
})

test('work map table parsing picks rows and never-delegate line', () => {
  const md = '# 김하늘의 업무 지도\n\n| 업무 | 빈도 | 소요시간 | 위임 희망도 | 필요한 연결 |\n|---|---|---|---|---|\n| 재고 | 주 2회 | 30분 | 3 | 없음 |\n| 주문 정리 | 매일 | 1시간 | 5 | 카톡 |\n\n- 절대 맡기기 싫은 일: 꽃 고르기\n'
  const r = parseWorkMap(md)
  assert.equal(r.rows.length, 2)
  assert.equal(r.rows[0].task, '주문 정리')
  assert.equal(r.rows[0].delegation, 5)
  assert.equal(r.never, '꽃 고르기')
  assert.equal(r.userName, '김하늘')
})

test('dashboard mini is built from config and seed', () => {
  const config = { name: '오피스', menus: [{ key: 'c-a', owner: 'x' }, { key: 'tasks', owner: '' }], customMenus: [{ key: 'c-a', label: '주문', kanban: true, statusLabels: { open: '접수' } }], theme: { emoji: '💐', tagline: '한 줄' }, widget: { title: '위젯' } }
  const seed = { records: { 'c-a': [{ title: 'A', status: 'open', dueAt: '2026-10-28T11:00' }, { title: 'B', status: 'done' }] } }
  const mini = dashboardMini(config, seed, { x: '다온' })
  assert.equal(mini.groups[0].items[0].owner, '다온')
  assert.equal(mini.widget.bigValue, '1건')
  assert.equal(mini.widget.list[0].meta, '11:00 · 접수')
  assert.equal(mini.tiles[1].label, '업무현황')
})

test('collect finds materials in a workspace and leaves human fields empty', () => {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'talk-ws-'))
  fs.mkdirSync(path.join(ws, 'teams/t'), { recursive: true }); fs.mkdirSync(path.join(ws, 'dashboard'))
  fs.writeFileSync(path.join(ws, 'teams/t/team.json'), JSON.stringify({ version: 1, agents: [{ id: 'bomi', name: '봄이', coordinator: true, menus: [], firstTasks: [{ task: '보고' }] }, { id: 'daon', name: '다온', menus: [] }] }))
  fs.writeFileSync(path.join(ws, 'dashboard/config.json'), JSON.stringify({ version: 1, menus: [{ key: 'tasks', owner: 'bomi' }] }))
  fs.writeFileSync(path.join(ws, 'config.json'), '{}') // not under dashboard/ → ignored
  const files = findFiles([ws])
  assert.ok(files.teamJson.endsWith('team.json'))
  assert.ok(files.dashConfig.includes(`${path.sep}dashboard${path.sep}`))
  const { talk, ask } = draftTalk({ files })
  assert.equal(talk.structure.coordinator.name, '봄이')
  assert.equal(talk.structure.specialists[0].name, '다온')
  assert.equal(talk.feelings.headline, '')
  assert.ok(ask.some(a => a.startsWith('feelings')))
})

test('build CLI writes all themes; publish dry-run reports size', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'talk-out-'))
  const res = JSON.parse(execFileSync('node', [path.join(scripts, 'build.mjs'), '--talk', path.join(root, 'examples/flower/talk.json'), '--all-themes', out], { encoding: 'utf8' }))
  assert.equal(res.written.length, 5)
  const pub = JSON.parse(execFileSync('node', [path.join(scripts, 'publish.mjs'), '--deck', path.join(out, 'deck-pop.html'), '--title', 't', '--dry-run'], { encoding: 'utf8' }))
  assert.equal(pub.theme, 'pop')
  const noTok = spawnSync('node', [path.join(scripts, 'publish.mjs'), '--deck', path.join(out, 'deck-pop.html'), '--title', 't', '--base', 'http://127.0.0.1:9'], { encoding: 'utf8', env: { ...process.env, RUN_ACADEMY_PLAZA_TOKEN: '', HOME: out } })
  assert.equal(noTok.status, 2)
})
