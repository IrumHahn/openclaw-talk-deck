// talk.json(발표 내용) + 테마 → 한 장짜리 발표 HTML.
// 1920×1080 캔버스를 화면 크기에 맞춰 줄인다. ←/→ 넘기기, F 전체화면, N 발표자 노트.
// 원칙: 모든 글은 이스케이프. 글꼴은 Pretendard 하나. 내용 양에 따라 배치를 바꿔 빈 화면이 생기지 않게 한다.
// 화면에 나오는 라벨은 청중(동기 수강생)에게 하는 쉬운 말로 쓴다 — 개발·작업 상태 용어 금지.
import { THEMES, PRETENDARD, BODY_FONT } from './themes.mjs'
import { OFFICE_TEMPLATES, OFFICE_CDN } from './offices.mjs'

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
const has = value => Array.isArray(value) ? value.some(has) : value !== undefined && value !== null && String(value).trim() !== ''
const lines = text => esc(text).replace(/\n/g, '<br>')
const list = arr => (Array.isArray(arr) ? arr : []).filter(has)
const SPRITES = new Set(['star', 'chart', 'gamepad', 'pen', 'laptop', 'palette', 'lens', 'mirror', 'sprout', 'book', 'camera', 'coffee'])

function head(eyebrow, title, lead) {
  return `<header class="hd"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="title">${lines(title)}</h2>${has(lead) ? `<p class="lead">${lines(lead)}</p>` : ''}</header>`
}
function slide(key, cls, body, notes) {
  return `<section class="slide ${cls}" data-key="${key}">${body}${has(notes) ? `<aside>${esc(notes)}</aside>` : ''}</section>`
}

// 가상 오피스 캐릭터 그림 주소(이름으로 찾기) — 멤버 카드에도 쓴다.
function spriteOf(t, name, view = 'front') {
  const o = t.office || {}
  const T = OFFICE_TEMPLATES[o.template]
  if (!T) return ''
  const a = list(o.agents).find(x => x.name === name)
  if (!a) return ''
  const sp = SPRITES.has(a.sprite) ? a.sprite : 'coffee'
  return `${OFFICE_CDN}${T.chars}/${sp}-${view}.png`
}

// ---------- 장별 ----------

function cover(t) {
  return `<div class="cover-top"><span class="chip">${esc(t.week ? `${t.week}주차 발표` : '발표')}</span><span class="muted">${esc(t.course || 'AI 에이전트 실전 1기')}</span></div>
<div class="cover-main"><h1 class="cover-title">${lines(t.title)}</h1>${has(t.subtitle) ? `<p class="cover-sub">${lines(t.subtitle)}</p>` : ''}</div>
<div class="cover-foot"><p><b>${esc(t.presenter?.name)}</b>${has(t.presenter?.about) ? ` · ${esc(t.presenter.about)}` : ''}</p><p class="muted">${esc(t.date || '')}</p></div>`
}

function agenda(sections) {
  const cols = sections.length <= 4 ? sections.length : 3
  return `${head('발표 순서', `오늘 ${['', '한', '두', '세', '네', '다섯', '여섯'][sections.length] || sections.length} 가지 이야기를 할게요`)}<div class="agenda" style="grid-template-columns:repeat(${cols},1fr)">${sections.map((s, i) => `<div class="card agenda-item"><p class="num">${String(i + 1).padStart(2, '0')}</p><h3>${esc(s.title)}</h3><p class="muted">${esc(s.desc)}</p></div>`).join('')}</div>`
}

function motivation(m) {
  const points = list(m.points).slice(0, 3)
  const rich = has(m.why) || points.length
  return `<header class="hd"><p class="eyebrow">참여 동기</p></header>
<div class="quote-wrap ${rich ? '' : 'solo'}"><p class="qmark">“</p><h2 class="quote">${lines(m.headline)}</h2>${has(m.why) ? `<p class="qwhy">${lines(m.why)}</p>` : ''}${points.length ? `<div class="chips">${points.map(p => `<span class="pill">${esc(p)}</span>`).join('')}</div>` : ''}</div>`
}

function workMap(w) {
  const rows = list(w.rows).slice(0, 6)
  const table = rows.length ? `<table class="tbl"><thead><tr><th>내가 하던 일</th><th>얼마나 자주</th><th>걸리는 시간</th><th>맡기고 싶은 마음</th><th>맡길 동료</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.task)}</b></td><td>${esc(r.frequency)}</td><td>${esc(r.duration)}</td><td>${has(r.delegation) && Number(r.delegation) ? `<span class="meter" style="--v:${Math.max(0, Math.min(5, Number(r.delegation) || 0))}"><i></i></span> ${esc(r.delegation)}/5` : ''}</td><td>${esc(r.owner)}</td></tr>`).join('')}</tbody></table>` : ''
  const never = has(w.never) ? `<div class="band"><span class="chip">이건 내가 할래요</span><p>${lines(w.never)}</p></div>` : ''
  const insight = has(w.insight) ? `<p class="insight">${lines(w.insight)}</p>` : ''
  return `${head('① 내가 생각하는 에이전트 팀', w.headline || '팀은 내 업무 지도에서 시작했어요', w.lead)}<div class="stack">${table}${never}${insight}</div>`
}

function orgChart(s, compact = false) {
  const W = compact ? 900 : 980
  const specs = list(s.specialists).slice(0, 4)
  const n = specs.length
  const gap = 24
  const w = n ? Math.min(360, (W - (n - 1) * gap) / n) : 0
  const x0 = (W - (n * w + (n - 1) * gap)) / 2
  const cx = W / 2
  const meH = compact ? 96 : 104, leadY = meH + 34, leadH = compact ? 96 : 108, midY = leadY + leadH + 22, specY = midY + 22, specH = compact ? 104 : 124
  const box = (x, y, bw, bh, cls, name, role) => `<div class="org-box ${cls}" style="left:${x}px;top:${y}px;width:${bw}px;height:${bh}px"><b>${esc(name)}</b>${has(role) ? `<span>${esc(role)}</span>` : ''}</div>`
  const centers = specs.map((_, i) => x0 + i * (w + gap) + w / 2)
  const L = [`<line x1="${cx}" y1="${meH}" x2="${cx}" y2="${leadY}"/>`]
  if (n) {
    L.push(`<line x1="${cx}" y1="${leadY + leadH}" x2="${cx}" y2="${midY}"/>`)
    if (n > 1) L.push(`<line x1="${centers[0]}" y1="${midY}" x2="${centers[n - 1]}" y2="${midY}"/>`)
    for (const c of centers) L.push(`<line x1="${c}" y1="${midY}" x2="${c}" y2="${specY}"/>`)
  }
  const coord = s.coordinator || {}
  const h = n ? specY + specH : leadY + leadH
  const meW = 440, leadW = 480
  return `<div class="org${compact ? ' compact' : ''}" style="width:${W}px;height:${h}px">
<svg class="org-lines" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" aria-hidden="true">${L.join('')}</svg>
${box(cx - meW / 2, 0, meW, meH, 'org-me', s.meLabel || '나', s.me || '방향을 정하고 확인해요')}
${box(cx - leadW / 2, leadY, leadW, leadH, 'org-lead', `${coord.emoji ? coord.emoji + ' ' : ''}${coord.name || '총괄'}`, coord.role)}
${specs.map((sp, i) => box(x0 + i * (w + gap), specY, w, specH, 'org-spec', `${sp.emoji ? sp.emoji + ' ' : ''}${sp.name}`, sp.role)).join('')}
</div>`
}

function promises(p, mode) {
  if (!p || ![p.auto, p.approve, p.never].some(has)) return ''
  const col = (label, cls, items) => has(items) ? `<div class="perm ${cls}"><p class="perm-label">${label}</p><ul>${list(items).slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''
  const body = col('혼자 해도 돼요', 'p-auto', p.auto) + col('나에게 먼저 물어봐요', 'p-approve', p.approve) + col('절대 하지 않아요', 'p-never', p.never)
  return mode === 'band' ? `<div class="perms-band"><p class="perms-title">일을 맡길 때의 약속</p><div class="perms-cols">${body}</div></div>` : `<div class="card perms"><h3>일을 맡길 때의 약속</h3>${body}</div>`
}

function structure(s) {
  const flow = list(s.flow).slice(0, 5)
  if (flow.length) {
    return `${head('① 우리 팀 구조', s.headline || '일은 이렇게 흘러가요', s.lead)}<div class="col-gap"><div class="row org-row">${orgChart(s, true)}<div class="flow"><p class="flow-title">일이 흘러가는 순서</p><ol>${flow.map(f => `<li>${esc(f)}</li>`).join('')}</ol></div></div>${promises(s.permissions, 'band')}</div>`
  }
  return `${head('① 우리 팀 구조', s.headline || '일은 이렇게 흘러가요', s.lead)}<div class="row org-row">${orgChart(s)}${promises(s.permissions, 'side')}</div>`
}

function members(m, t) {
  const ms = list(m.list).slice(0, 4)
  const field = (label, value) => has(value) ? `<div class="mf"><span>${label}</span><p>${esc(value)}</p></div>` : ''
  const card = (a, i, wide) => {
    const img = spriteOf(t, a.name)
    return `<div class="card member ${i === 0 ? 'lead' : ''} ${wide ? 'wide' : ''}">
<div class="mtop">${img ? `<img class="mface" src="${esc(img)}" alt="">` : ''}<div><p class="kind">${esc(a.kind || (i === 0 ? '총괄' : '전문가'))}</p><h3 class="mname">${esc(a.emoji && !img ? a.emoji + ' ' : '')}${esc(a.name)}</h3>${has(a.role) ? `<p class="mrole">${esc(a.role)}</p>` : ''}</div></div>
<div class="mfields">${field('나와의 관계', a.relation)}${field('말투', a.tone)}${field('싫어하는 것', a.dislike)}${field('처음 맡긴 일', a.firstTask)}</div>
${has(a.quote) ? `<p class="mquote">“${esc(a.quote)}”</p>` : ''}</div>`
  }
  return `${head('② 팀 멤버 소개', m.headline || '같이 일하고 싶은 동료로 만들었어요', m.lead)}<div class="members" style="grid-template-columns:repeat(${Math.max(1, ms.length)},1fr)">${ms.map((a, i) => card(a, i, ms.length === 1)).join('')}</div>`
}

function selfIntro(s) {
  const checks = list(s.checks).slice(0, 5)
  return `${head('② 총괄 자기소개', s.headline || '"네 소개 해줘"에 돌아온 대답', s.lead)}<div class="row">
<div class="chat card"><p class="bubble me">네 소개 해줘</p><p class="bubble bot">${lines(s.quote)}</p></div>
${checks.length || has(s.fix) ? `<div class="checks"><h3>내가 정한 대로 나왔을까?</h3>${checks.map(c => `<p class="check ${c.ok === false ? 'no' : 'ok'}"><span>${c.ok === false ? '고쳤어요' : '맞아요'}</span>${esc(c.text)}</p>`).join('')}${has(s.fix) ? `<p class="fix">${lines(s.fix)}</p>` : ''}</div>` : ''}</div>`
}

function futureTeam(f) {
  const steps = list(f.steps).slice(0, 4)
  return `${head('② 앞으로 만들 팀', f.headline || '4주 뒤 우리 팀의 모습', f.lead)}<div class="timeline" style="grid-template-columns:repeat(${Math.max(1, steps.length)},1fr)">${steps.map((s, i) => `<div class="step ${i === 0 ? 'now' : ''}"><p class="when">${esc(s.when)}</p><h3>${esc(s.title)}</h3><p class="muted">${lines(s.desc)}</p></div>`).join('')}</div>${has(f.principle) ? `<p class="principle">우리 팀의 원칙 — <b>${esc(f.principle)}</b></p>` : ''}`
}

function miniDashboard(d) {
  const groups = list(d.groups).slice(0, 3)
  const tiles = list(d.tiles).slice(0, 6)
  const wg = d.widget
  const bars = wg && list(wg.bars).length ? (() => { const max = Math.max(1, ...wg.bars.map(b => Number(b.value) || 0)); return `<div class="mini-bars">${wg.bars.slice(0, 5).map(b => `<div class="mini-bar"><span>${esc(b.label)}</span><i><em style="width:${((Number(b.value) || 0) / max) * 100}%"></em></i><b>${esc(b.value)}</b></div>`).join('')}</div>` })() : ''
  const widget = wg && (has(wg.bigValue) || list(wg.list).length) ? `<div class="mini-widget"><p class="mini-wtitle">${esc(wg.title || '나의 위젯')}</p><div class="mini-wbody"><div><p class="mini-blabel">${esc(wg.bigLabel || '')}</p><p class="mini-big">${esc(wg.bigValue ?? '')}</p>${has(wg.sub) ? `<p class="mini-sub">${esc(wg.sub)}</p>` : ''}${bars}</div>${list(wg.list).length ? `<ul class="mini-list">${wg.list.slice(0, 4).map((x, i) => `<li class="${i === 0 ? 'first' : ''}"><b>${esc(x.title)}</b><span>${esc(x.meta)}</span></li>`).join('')}</ul>` : ''}</div></div>` : ''
  return `<div class="mini ${widget ? '' : 'no-widget'}">
<div class="mini-side"><p class="mini-logo">${esc(d.emoji || '')} ${esc(d.name || '내 AI 오피스')}</p>${groups.map(g => `<p class="mini-group">${esc(g.label)}</p>${list(g.items).slice(0, 6).map(it => `<p class="mini-item">${esc(it.label)}${has(it.owner) ? `<span>${esc(it.owner)}</span>` : ''}</p>`).join('')}`).join('')}</div>
<div class="mini-main"><p class="mini-name">${esc(d.name || '내 AI 오피스')}</p>${has(d.tagline) ? `<p class="mini-tag">${esc(d.tagline)}</p>` : ''}
<div class="mini-tiles">${tiles.map(tl => `<div class="mini-tile"><i class="mini-ic">${esc([...String(tl.label || '')][0] || '')}</i><b>${esc(tl.label)}</b><span>${esc(tl.sub)}</span></div>`).join('')}</div>${widget}</div></div>`
}

function dashboard(d) {
  const visual = has(d.screenshot) ? `<img class="shot" src="${esc(d.screenshot)}" alt="내 대시보드 화면">` : miniDashboard(d.mini || {})
  const callouts = list(d.callouts).slice(0, 3)
  return `${head('③ 대시보드 리뷰', d.headline || '열자마자 보이는 것', d.lead)}<div class="row dash-row">${visual}<div class="callouts">${callouts.map((c, i) => `<div><p class="callout-t"><span class="cnum">${i + 1}</span>${esc(c.title)}</p><p class="muted">${lines(c.text)}</p></div>`).join('')}</div></div>`
}

function review(r) {
  const col = (cls, title, items) => list(items).length ? `<div class="card rv ${cls}"><h3>${title}</h3><ul>${list(items).slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''
  return `${head('③ 써 보니', r.headline || '며칠 써 본 솔직한 이야기', r.lead)}<div class="two">${col('good', '좋았던 점', r.good)}${col('bad', '아쉬운 점', r.bad)}</div>`
}

function futureDash(f) {
  const rows = list(f.rows).slice(0, 5)
  return `${head('③ 앞으로 만들 대시보드', f.headline || '빈 메뉴가 하나씩 채워질 거예요', f.lead)}<div class="stack">${rows.length ? `<table class="tbl"><thead><tr><th>언제</th><th>채울 메뉴</th><th>무엇이 보이게</th><th>맡을 동료</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.when)}</b></td><td>${esc(r.menu)}</td><td>${esc(r.shows)}</td><td>${esc(r.owner)}</td></tr>`).join('')}</tbody></table>` : ''}${has(f.widgetNext) ? `<div class="band"><span class="chip">위젯 다음 버전</span><p>${lines(f.widgetNext)}</p></div>` : ''}</div>`
}

// 가상 오피스: 키트 CDN 배경 + 캐릭터를 엔진과 같은 규칙으로 자리에 앉힌 장면.
// 자리: 총괄 → leader 자리, 나머지 직원 → 남은 자리 순서, 곧 올 동료 → 그다음(반투명 + 점선 이름표).
export function officeScene(o, width = 1180) {
  const T = OFFICE_TEMPLATES[o.template]
  if (!T) return ''
  const height = Math.round(width * 941 / 1672)
  const seats = T.seats.map(([x, y, view, leader]) => ({ x, y, view, leader }))
  const leaderSeat = seats.find(s => s.leader) || seats[0]
  const rest = seats.filter(s => s !== leaderSeat)
  const agents = [...list(o.agents)].sort((a, b) => (b.coordinator === true) - (a.coordinator === true))
  const placed = []
  agents.forEach((a, i) => { const seat = i === 0 ? leaderSeat : rest.shift(); if (seat) placed.push({ a, seat, ghost: false }) })
  list(o.planned).forEach(p => { const seat = rest.shift(); if (seat) placed.push({ a: { name: p.title, sprite: p.sprite || 'coffee' }, seat, ghost: true }) })
  const actors = placed.sort((p, q) => p.seat.y - q.seat.y).map(({ a, seat, ghost }) => {
    const k = T.depth ? T.depth[0] + (T.depth[1] - T.depth[0]) * (seat.y / 100) : 1
    const h = Math.round(width * T.scale * k)
    const sprite = SPRITES.has(a.sprite) ? a.sprite : 'coffee'
    const view = seat.view === 'back' ? 'back' : 'front'
    return `<div class="vo-actor${ghost ? ' ghost' : ''}" style="left:${seat.x}%;top:${seat.y}%"><span class="vo-tag">${esc(a.name)}</span><img src="${OFFICE_CDN}${T.chars}/${sprite}-${view}.png" alt="" style="height:${h}px${T.pixel ? ';image-rendering:pixelated' : ''}"></div>`
  }).join('')
  return `<div class="vo-stage" style="width:${width}px;height:${height}px;background-image:url('${OFFICE_CDN}${T.bg}')">${actors}</div>`
}

function office(o) {
  const T = OFFICE_TEMPLATES[o.template]
  const visual = has(o.screenshot) ? `<img class="shot" src="${esc(o.screenshot)}" alt="가상 오피스 화면">` : officeScene(o)
  const team = list(o.agents).length
  const planned = list(o.planned).length
  return `<header class="hd"><p class="eyebrow">가상 오피스</p><h2 class="title">${lines(o.headline || '우리 팀이 일하는 사무실')}</h2></header>
<div class="row dash-row">${visual}<div class="vo-side">
${T ? `<div class="vo-badge"><small>고른 사무실</small><b>${esc(T.label)}</b><p>${esc(T.desc)}</p></div>` : ''}
${has(o.why) ? `<div><p class="callout-t">이 사무실을 고른 이유</p><p class="muted">${lines(o.why)}</p></div>` : ''}
<div class="vo-count"><div><b>${team}</b><span>지금 일하는 동료</span></div><div><b>${planned}</b><span>곧 올 동료</span></div></div>
${planned ? `<p class="vo-legend"><i></i>반투명한 자리는 앞으로 함께할 동료의 자리예요</p>` : ''}
</div></div>`
}

function officeTeam(o) {
  const T = OFFICE_TEMPLATES[o.template]
  if (!T) return ''
  const sp = s => `${OFFICE_CDN}${T.chars}/${SPRITES.has(s) ? s : 'coffee'}-front.png`
  const agents = [...list(o.agents)].sort((a, b) => (b.coordinator === true) - (a.coordinator === true))
  const cards = [
    ...agents.map(a => `<div class="card seat"><img class="seat-face${T.pixel ? ' px' : ''}" src="${sp(a.sprite)}" alt=""><div class="seat-body"><p class="kind">${esc(a.coordinator ? '총괄' : (a.role || '동료'))}</p><h3>${esc(a.name)}</h3>${list(a.tasks).length ? `<ul>${list(a.tasks).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : (a.coordinator && has(a.role) ? `<p class="muted">${esc(a.role)}</p>` : '')}</div></div>`),
    ...list(o.planned).map(p => `<div class="card seat ghost"><img class="seat-face${T.pixel ? ' px' : ''}" src="${sp(p.sprite)}" alt=""><div class="seat-body"><p class="kind">곧 올 동료</p><h3>${esc(p.title)}</h3>${has(p.reason) ? `<p class="muted">${esc(p.reason)}</p>` : ''}</div></div>`),
  ].slice(0, 6)
  const cols = cards.length <= 3 ? cards.length : Math.ceil(cards.length / 2)
  return `${head('가상 오피스 · 자리 소개', o.teamHeadline || '사무실에 누가 앉아 있을까요', o.teamLead)}<div class="seats" style="grid-template-columns:repeat(${Math.max(1, cols)},1fr)">${cards.join('')}</div>`
}

function feelings(f) {
  const boxes = [['막힌 곳', f.stuck], ['놀란 순간', f.surprise], ['다음 주에 맡길 일', f.nextWeek]].filter(([, v]) => has(v))
  const n = boxes.length
  return `<header class="hd"><p class="eyebrow">④ 1주차 소감</p><h2 class="title big-quote">${lines(f.headline)}</h2>${has(f.story) ? `<p class="lead">${lines(f.story)}</p>` : ''}</header>
${n ? `<div class="fgrid n${n}">${boxes.map(([label, text]) => `<div class="card fbox"><p class="flabel">${label}</p><p>${lines(text)}</p></div>`).join('')}</div>` : ''}`
}

function goal(g) {
  const items = list(g.items).slice(0, 4)
  const road = list(g.roadmap).slice(0, 4)
  if (!items.length && !road.length) {
    return `<div class="solo-wrap"><p class="eyebrow">한 달 뒤 완성하고 싶은 것</p><h2 class="solo-title">${lines(g.headline)}</h2>${has(g.why) ? `<p class="lead">${lines(g.why)}</p>` : ''}</div>`
  }
  return `${head('한 달 뒤 완성하고 싶은 것', g.headline, g.why)}<div class="stack">
${items.length ? `<div class="goals" style="grid-template-columns:repeat(${items.length},1fr)">${items.map((x, i) => `<div class="card goal"><p class="gnum">${String(i + 1).padStart(2, '0')}</p><p>${lines(x)}</p></div>`).join('')}</div>` : ''}
${road.length ? `<div class="road">${road.map(r => `<div class="road-step"><b>${esc(r.week)}</b><p>${esc(r.text)}</p></div>`).join('<i class="road-arrow">→</i>')}</div>` : ''}</div>`
}

function pledge(p, t) {
  const ps = list(p.pledges).slice(0, 4)
  return `<header class="hd"><p class="eyebrow">다짐과 선언</p></header><div class="pledge ${ps.length ? '' : 'solo'}">${ps.length ? `<ol class="plist">${ps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}<h2 class="declare">${lines(p.declaration)}</h2><div class="sign"><span>${esc(p.name || t.presenter?.name || '')}</span><i></i><span>${esc(p.date || t.date || '')}</span></div></div>`
}

function closing(c, t) {
  return `<div class="close"><h2 class="cover-title">${lines(c.line || '감사합니다')}</h2>${has(c.ask) ? `<p class="cover-sub">${lines(c.ask)}</p>` : ''}<p class="muted">${esc(t.presenter?.name || '')}</p></div>`
}

// ---------- 조립 ----------

export function buildSlides(t) {
  const notes = t.notes || {}
  const out = []
  const sections = []
  const add = (key, cls, body) => { if (body) out.push(slide(key, cls, body, notes[key])) }
  const hasOffice = has(t.office?.template) && (OFFICE_TEMPLATES[t.office.template] || has(t.office.screenshot))
  if (has(t.motivation?.headline)) sections.push({ title: '참여 동기', desc: '왜 이 과정에 왔는지' })
  if (has(t.workMap?.rows) || has(t.structure?.coordinator?.name)) sections.push({ title: '내가 생각하는 에이전트 팀', desc: '업무 지도와 팀 구조' })
  if (has(t.members?.list)) sections.push({ title: '팀 멤버 소개', desc: '지금의 동료와 4주 뒤 모습' })
  if (has(t.dashboard) || has(t.review?.good) || has(t.futureDashboard?.rows)) sections.push({ title: '대시보드와 가상 오피스', desc: hasOffice ? '나만의 메뉴·위젯과 우리 사무실' : '나만의 메뉴와 위젯' })
  if (has(t.feelings?.headline)) sections.push({ title: '1주차 소감', desc: '막힌 곳과 놀란 순간' })
  if (has(t.goal?.headline) || has(t.pledge?.declaration)) sections.push({ title: '한 달 뒤의 나', desc: '완성하고 싶은 것과 다짐' })

  add('cover', 's-cover dark', cover(t))
  if (sections.length > 1 && t.agenda !== false) add('agenda', 's-agenda', agenda(sections))
  if (has(t.motivation?.headline)) add('motivation', 's-quote', motivation(t.motivation))
  if (has(t.workMap?.rows) || has(t.workMap?.never)) add('workmap', '', workMap(t.workMap))
  if (has(t.structure?.coordinator?.name)) add('structure', has(t.structure.flow) ? 's-tight' : '', structure(t.structure))
  if (has(t.members?.list)) add('members', '', members(t.members, t))
  if (has(t.selfIntro?.quote)) add('selfintro', '', selfIntro(t.selfIntro))
  if (has(t.futureTeam?.steps)) add('futureteam', '', futureTeam(t.futureTeam))
  if (t.dashboard && (has(t.dashboard.screenshot) || has(t.dashboard.mini?.name) || has(t.dashboard.mini?.groups))) add('dashboard', 's-dash', dashboard(t.dashboard))
  if (has(t.review?.good) || has(t.review?.bad)) add('review', '', review(t.review))
  if (has(t.futureDashboard?.rows) || has(t.futureDashboard?.widgetNext)) add('futuredash', '', futureDash(t.futureDashboard))
  if (hasOffice) {
    add('office', 's-office', office(t.office))
    if (OFFICE_TEMPLATES[t.office.template] && t.office.teamSlide !== false) add('officeteam', '', officeTeam(t.office))
  }
  if (has(t.feelings?.headline)) add('feelings', 's-feel dark', feelings(t.feelings))
  if (has(t.goal?.headline)) add('goal', list(t.goal.items).length || list(t.goal.roadmap).length ? '' : 's-solo', goal(t.goal))
  if (has(t.pledge?.declaration)) add('pledge', 's-pledge dark', pledge(t.pledge, t))
  if (t.closing !== false) add('closing', 's-close dark', closing(t.closing || {}, t))
  return out
}

/** 장마다 화면에 보이는 글자 수(발표자 노트 제외) — 빈약한 장을 찾는 데 쓴다. */
export function slideTextStats(t) {
  return buildSlides(t).map(html => {
    const key = html.match(/data-key="([^"]+)"/)[1]
    const text = html.replace(/<aside>[\s\S]*?<\/aside>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim()
    return { key, chars: text.length }
  })
}

function css(theme) {
  const v = theme.vars
  return `:root{--bg:${v.bg};--bg2:${v.bg2};--ink:${v.ink};--muted:${v.muted};--accent:${v.accent};--accent2:${v.accent2};--card:${v.card};--line:${v.line};--dark:${v.dark};--dark-ink:${v.darkInk};--soft:${v.soft};--radius:${v.radius};--border:${v.border};--shadow:${v.shadow};--hweight:${theme.headingWeight};--font:${BODY_FONT}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#0b0b0c;overflow:hidden;font-family:var(--font);-webkit-font-smoothing:antialiased;word-break:keep-all}
#stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:center;transform:translate(-50%,-50%)}
.slide{position:absolute;inset:0;display:none;flex-direction:column;gap:40px;padding:96px 128px 104px;background:var(--bg);color:var(--ink);overflow:hidden}
.slide.on{display:flex}
.slide aside{display:none}
.dark{background:var(--dark);color:var(--dark-ink)}
.dark .muted,.dark .lead{color:color-mix(in srgb,var(--dark-ink) 72%,transparent)}
.muted{color:var(--muted)}
.hd{display:flex;flex-direction:column;gap:14px}
.eyebrow{font-size:28px;font-weight:700;color:var(--accent);letter-spacing:-.005em}
.title{font-weight:var(--hweight);font-size:72px;line-height:1.2;letter-spacing:-.025em}
.lead{font-size:32px;line-height:1.55;color:var(--muted);max-width:1560px;margin-top:4px}
h3{font-size:38px;font-weight:800;line-height:1.3;letter-spacing:-.015em}
p,li,td,th{font-size:30px;line-height:1.55}
.slide>.hd+*{margin-top:auto;margin-bottom:auto}
.card{background:var(--card);border:var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:36px}
.chip{display:inline-block;font-size:24px;font-weight:700;background:var(--accent);color:var(--bg);padding:6px 18px;border-radius:999px;white-space:nowrap}
.pill{display:inline-block;font-size:28px;font-weight:600;background:var(--soft);color:var(--ink);padding:10px 22px;border-radius:999px}
.row{display:flex;gap:44px;align-items:flex-start}
.stack,.col-gap{display:flex;flex-direction:column;gap:30px}
.s-cover{justify-content:space-between}
.cover-top{display:flex;gap:18px;align-items:center}.cover-top .muted{font-size:26px}
.cover-main{display:flex;flex-direction:column;gap:30px}
.cover-title{font-weight:var(--hweight);font-size:120px;line-height:1.12;letter-spacing:-.035em}
.cover-sub{font-size:40px;line-height:1.45;color:var(--accent);max-width:1500px;font-weight:500}
.cover-foot{display:flex;justify-content:space-between;align-items:flex-end}.cover-foot p{font-size:30px}
.agenda{display:grid;gap:24px}
.agenda-item{display:flex;flex-direction:column;gap:14px;background:var(--bg2);padding:40px 36px}
.agenda-item .num{font-size:40px;font-weight:900;color:var(--accent)}.agenda-item p.muted{font-size:28px}
.quote-wrap{display:flex;flex-direction:column;gap:28px;max-width:1560px}
.quote-wrap.solo{margin:auto 0}
.qmark{font-size:220px;font-weight:900;line-height:.6;color:var(--accent);height:100px}
.quote{font-weight:var(--hweight);font-size:80px;line-height:1.28;letter-spacing:-.03em}
.quote-wrap.solo .quote{font-size:96px}
.qwhy{font-size:36px;color:var(--muted);line-height:1.6}
.chips{display:flex;flex-wrap:wrap;gap:14px}
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-size:26px;color:var(--muted);text-align:left;font-weight:700;padding:14px 18px;border-bottom:2px solid var(--ink)}
.tbl td{padding:22px 18px;border-bottom:1px solid var(--line)}
.tbl tbody tr:nth-child(even){background:var(--bg2)}
.meter{display:inline-block;width:110px;height:12px;border-radius:6px;background:var(--line);vertical-align:middle;margin-right:8px;overflow:hidden}.meter i{display:block;height:100%;width:calc(var(--v) * 20%);background:var(--accent)}
.band{display:flex;gap:24px;align-items:center;background:var(--dark);color:var(--dark-ink);padding:28px 40px;border-radius:var(--radius)}
.band p{font-size:34px}
.insight{font-size:34px;font-weight:600;color:var(--accent2);border-left:6px solid var(--accent2);padding-left:24px}
.org{position:relative;flex:none}
.org-lines{position:absolute;left:0;top:0;color:var(--muted)}.org-lines line{stroke:currentColor;stroke-width:3}
.org-box{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;border-radius:var(--radius);padding:10px 14px}
.org-box b{font-size:34px;font-weight:800;line-height:1.2}.org-box span{font-size:23px;line-height:1.3}.org.compact .org-box b{font-size:30px}.org.compact .org-box span{font-size:21px}
.org-me{background:var(--bg2);border:2px solid var(--ink)}
.org-lead{background:var(--dark);color:var(--dark-ink)}.org-lead span{color:color-mix(in srgb,var(--dark-ink) 80%,transparent)}
.org-spec{background:var(--card);border:2px solid var(--accent2);box-shadow:var(--shadow)}.org-spec b{color:var(--accent2)}.org-spec span{color:var(--muted)}
.flow{flex:1;display:flex;flex-direction:column;gap:16px}
.flow-title{font-size:30px;font-weight:800;color:var(--accent)}
.flow ol{list-style:none;counter-reset:fl;display:flex;flex-direction:column;gap:14px}
.flow li{counter-increment:fl;display:flex;gap:16px;align-items:baseline;font-size:27px;line-height:1.42}
.flow li::before{content:counter(fl);flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;font-weight:800;background:var(--soft);color:var(--accent)}
.perms{flex:1;display:flex;flex-direction:column;gap:22px;background:var(--bg2)}
.perms-band{background:var(--bg2);border-radius:var(--radius);padding:20px 30px;display:flex;flex-direction:column;gap:8px}
.perms-title{font-size:26px;font-weight:800;color:var(--muted)}
.perms-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.perm-label{font-size:26px;font-weight:800}
.perm ul{list-style:none;display:flex;flex-direction:column;gap:2px;margin-top:4px}.perm li{font-size:23px;line-height:1.4;color:var(--muted)}.perm li::before{content:'· '}
.p-auto .perm-label{color:var(--accent2)}.p-approve .perm-label{color:var(--accent)}
.members{display:grid;gap:24px}
.member{display:flex;flex-direction:column;gap:14px;background:var(--bg2);padding:30px 32px}
.member.lead{background:var(--dark);color:var(--dark-ink)}
.mtop{display:flex;gap:20px;align-items:center}
.mface{height:104px;width:auto;flex:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.18))}
.member .kind{font-size:24px;font-weight:700;color:var(--accent)}
.mname{font-weight:var(--hweight);font-size:52px;letter-spacing:-.02em}
.mrole{font-size:26px;opacity:.8}
.mfields{display:flex;flex-direction:column;gap:8px}
.mf span{display:block;font-size:21px;font-weight:700;opacity:.65}.mf p{font-size:27px;line-height:1.4}
.mquote{font-size:26px;line-height:1.45;padding:14px 18px;border-radius:14px;background:color-mix(in srgb,var(--accent) 12%,transparent)}
.member.wide{display:grid;grid-template-columns:1fr 1.4fr;gap:40px;align-items:start}
.member.wide .mfields{grid-row:span 2}
.chat{flex:1;display:flex;flex-direction:column;gap:22px;background:var(--bg2)}
.bubble{font-size:33px;padding:18px 26px;border-radius:20px;max-width:900px}
.bubble.me{align-self:flex-end;background:var(--dark);color:var(--dark-ink)}
.bubble.bot{align-self:flex-start;background:var(--card);border:var(--border)}
.checks{width:560px;display:flex;flex-direction:column;gap:18px}
.check{display:flex;gap:14px;align-items:center;font-size:31px}
.check span{font-size:22px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--accent2);color:var(--bg);white-space:nowrap}
.check.no span{background:var(--accent)}
.fix{font-size:28px;background:var(--bg2);padding:16px 20px;border-radius:12px;color:var(--muted)}
.timeline{display:grid}
.step{display:flex;flex-direction:column;gap:14px;padding:40px 34px;border-top:8px solid var(--accent2)}
.step.now{border-top-color:var(--ink);background:var(--bg2)}
.step:last-child{border-top-color:var(--accent)}
.when{font-size:28px;font-weight:700;color:var(--accent2)}.step p.muted{font-size:29px}
.principle{font-size:36px;color:var(--accent2);margin-top:-12px}
.dash-row{align-items:stretch}
.shot{width:1160px;height:650px;object-fit:contain;background:var(--bg2);border:var(--border);border-radius:12px;flex:none}
.callouts{flex:1;display:flex;flex-direction:column;gap:30px;justify-content:center}
.callout-t{font-size:31px;font-weight:800;color:var(--accent);display:flex;gap:12px;align-items:center}.callouts p.muted{font-size:28px}
.cnum{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--accent);color:var(--bg);font-size:22px;flex:none}
.mini{width:1160px;height:650px;display:flex;background:#F6F5F1;color:#1d211e;border:2px solid var(--line);border-radius:14px;overflow:hidden;flex:none}
.mini p{line-height:1.35}
.mini-side{width:270px;background:#EAEAE3;padding:24px 18px;display:flex;flex-direction:column;gap:8px}
.mini-logo{font-size:21px;font-weight:800;margin-bottom:8px}
.mini-group{font-size:16px;color:#6b706a;margin-top:12px;font-weight:600}
.mini-item{font-size:19px;padding:6px 8px;border-radius:6px;display:flex;justify-content:space-between;gap:6px}
.mini-item span{font-size:15px;color:#6b706a;white-space:nowrap}
.mini-main{flex:1;padding:30px 34px;display:flex;flex-direction:column;gap:16px;min-width:0}
.mini-name{font-size:38px;font-weight:800;letter-spacing:-.02em}
.mini-tag{font-size:19px;color:#5c635d;margin-top:-8px}
.mini-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.mini-tile{padding:16px 18px;border:1px solid #dcdcd2;border-radius:10px;background:#fbfbf8;display:flex;flex-direction:column;gap:6px}
.mini-tile b{font-size:20px}.mini-tile span{font-size:16px;color:#6b706a}
.mini.no-widget .mini-tiles{flex:1;grid-auto-rows:1fr}.mini.no-widget .mini-tile{justify-content:flex-end;gap:8px;padding:20px 22px;background:linear-gradient(160deg,#fff 0%,#f3f2ec 100%);position:relative}.mini-ic{display:none}.mini.no-widget .mini-ic{display:grid;place-items:center;position:absolute;left:22px;top:20px;width:48px;height:48px;border-radius:14px;font-style:normal;font-size:24px;font-weight:800;background:color-mix(in srgb,var(--accent) 16%,#fff);color:var(--accent)}.mini.no-widget .mini-tile b{font-size:26px}.mini.no-widget .mini-tile span{font-size:18px}
.mini-widget{border:1px solid #dcdcd2;border-radius:10px;background:#fbfbf8;padding:18px 20px;display:flex;flex-direction:column;gap:10px;flex:1;min-height:0}
.mini-wtitle{font-size:20px;font-weight:700}
.mini-wbody{display:grid;grid-template-columns:1fr 1.1fr;gap:18px}
.mini-blabel{font-size:15px;color:#6b706a;font-weight:600}
.mini-big{font-size:54px;font-weight:800;color:var(--accent2);line-height:1.05}
.mini-sub{font-size:16px}
.mini-bars{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.mini-bar{display:grid;grid-template-columns:80px 1fr 22px;align-items:center;gap:8px}
.mini-bar span,.mini-bar b{font-size:15px}
.mini-bar i{display:block;height:8px;background:#e1e1d8;border-radius:4px;overflow:hidden}.mini-bar em{display:block;height:100%;background:var(--accent2)}
.mini-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.mini-list li{display:flex;justify-content:space-between;gap:8px;font-size:16px;padding:8px 10px;border:1px solid #dcdcd2;border-radius:6px;background:#fff;line-height:1.3}
.mini-list li span{color:#6b706a;white-space:nowrap;font-size:15px}.mini-list li.first{border-color:var(--accent)}.mini-list li.first span{color:var(--accent);font-weight:700}
.two{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.rv{display:flex;flex-direction:column;gap:20px;padding:48px}
.rv.good h3{color:var(--accent2)}.rv.bad h3{color:var(--accent)}
.rv ul{padding-left:40px;display:flex;flex-direction:column;gap:16px}.rv li{font-size:33px}
.s-office{padding-top:80px;gap:30px}
.s-tight{padding-top:76px;padding-bottom:70px;gap:24px}.s-tight .title{font-size:62px}.s-tight .lead{font-size:28px}.s-tight .col-gap{gap:22px}.s-tight .hd{gap:8px}
.vo-stage{position:relative;flex:none;background-size:cover;background-position:center;border-radius:16px;border:var(--border);overflow:hidden}
.vo-actor{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none}
.vo-actor img{display:block;width:auto;filter:drop-shadow(0 6px 4px rgba(0,0,0,.2))}
.vo-tag{font-size:18px;font-weight:700;line-height:1.2;white-space:nowrap;background:rgba(255,255,255,.94);color:#1d211e;padding:4px 10px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.vo-actor.ghost img{opacity:.42;filter:grayscale(.6)}
.vo-actor.ghost .vo-tag{background:rgba(255,255,255,.8);border:1.5px dashed var(--accent);color:var(--accent)}
.vo-side{flex:1;display:flex;flex-direction:column;gap:28px;justify-content:center}
.vo-badge{background:var(--bg2);border-radius:var(--radius);padding:26px 28px;display:flex;flex-direction:column;gap:8px}
.vo-badge small{font-size:22px;font-weight:700;color:var(--muted)}.vo-badge b{font-size:38px;font-weight:800;color:var(--accent)}.vo-badge p{font-size:25px;line-height:1.5;color:var(--muted)}
.vo-count{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vo-count div{border:var(--border);border-radius:var(--radius);padding:18px 20px;display:flex;flex-direction:column;background:var(--card)}
.vo-count b{font-size:56px;font-weight:900;line-height:1.1;color:var(--accent2)}.vo-count span{font-size:22px;color:var(--muted)}
.vo-legend{font-size:23px;color:var(--muted);display:flex;gap:10px;align-items:center}.vo-legend i{width:30px;height:20px;border:2px dashed var(--accent);border-radius:6px;flex:none}
.seats{display:grid;gap:24px;grid-auto-rows:1fr}
.seat{display:flex;gap:30px;align-items:center;background:var(--bg2);padding:36px 36px}
.seat-face{height:220px;width:auto;flex:none;filter:drop-shadow(0 8px 8px rgba(0,0,0,.18))}.seat-face.px{image-rendering:pixelated}
.seat-body{display:flex;flex-direction:column;gap:6px;min-width:0}
.seat .kind{font-size:24px;font-weight:700;color:var(--accent)}
.seat h3{font-size:46px}
.seat ul{list-style:none;display:flex;flex-direction:column;gap:4px}.seat li{font-size:28px;line-height:1.45;color:var(--muted)}.seat li::before{content:'· '}
.seat .muted{font-size:27px;line-height:1.45}
.seat.ghost{background:transparent;border:3px dashed var(--accent);box-shadow:none}.seat.ghost .seat-face{opacity:.5;filter:grayscale(.5)}
.s-feel{justify-content:space-between}
.big-quote{font-size:70px;line-height:1.3}
.fgrid{display:grid;gap:24px}
.fgrid.n1{grid-template-columns:1fr}.fgrid.n2{grid-template-columns:1fr 1fr}.fgrid.n3{grid-template-columns:repeat(3,1fr)}
.fbox{background:color-mix(in srgb,var(--dark-ink) 8%,transparent);border-color:transparent;box-shadow:none;display:flex;flex-direction:column;gap:12px}
.fbox p{font-size:32px}.fgrid.n1 .fbox{flex-direction:row;align-items:center;gap:40px;padding:44px 48px}.fgrid.n1 .fbox p:last-child{font-size:44px;font-weight:700}
.flabel{font-size:30px;font-weight:800;color:var(--accent);white-space:nowrap}
.goals{display:grid;gap:24px}
.goal{display:flex;flex-direction:column;gap:16px;background:var(--bg2)}
.gnum{font-size:44px;font-weight:900;color:var(--accent)}.goal p:last-child{font-size:33px;line-height:1.45}
.road{display:flex;align-items:stretch;gap:14px}
.road-step{flex:1;border:var(--border);border-radius:var(--radius);padding:22px 24px;background:var(--card)}.road-step b{font-size:26px;color:var(--accent2)}.road-step p{font-size:27px;line-height:1.45}
.road-arrow{align-self:center;font-style:normal;font-size:34px;color:var(--muted)}
.s-solo{justify-content:center}
.solo-wrap{display:flex;flex-direction:column;gap:30px;max-width:1600px}
.solo-title{font-weight:var(--hweight);font-size:120px;line-height:1.15;letter-spacing:-.035em}
.s-pledge{justify-content:space-between}
.pledge{display:flex;flex-direction:column;gap:44px;margin:auto 0}
.plist{list-style:none;counter-reset:pl;display:flex;flex-direction:column;gap:18px}
.plist li{counter-increment:pl;font-size:36px;line-height:1.4;display:flex;gap:22px;align-items:baseline}
.plist li::before{content:counter(pl);flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:26px;font-weight:800;background:var(--accent);color:var(--dark)}
.declare{font-weight:var(--hweight);font-size:80px;line-height:1.25;letter-spacing:-.03em}
.pledge.solo .declare{font-size:104px}
.sign{display:flex;align-items:center;gap:24px;font-size:30px}.sign i{flex:0 0 360px;height:2px;background:currentColor;opacity:.5}
.s-close{justify-content:center}
.close{display:flex;flex-direction:column;gap:30px}
#ui{position:fixed;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.08);z-index:5}
#bar{height:100%;width:0;background:${v.accent};transition:width .25s}
#num{position:fixed;right:16px;bottom:12px;font:600 13px/1 var(--font);color:rgba(255,255,255,.55);background:rgba(0,0,0,.35);padding:5px 9px;border-radius:999px;z-index:5}
#notes{position:fixed;left:16px;right:16px;bottom:16px;max-height:34vh;overflow:auto;background:rgba(15,15,18,.92);color:#f2f2f2;font:16px/1.6 var(--font);padding:16px 20px;border-radius:12px;display:none;z-index:6;white-space:pre-wrap}
#notes.on{display:block}
#help{position:fixed;left:16px;bottom:12px;font:12px/1 var(--font);color:rgba(255,255,255,.45);z-index:5}
${themeExtra(theme)}`
}

function themeExtra(theme) {
  switch (theme.key) {
    case 'paper': return `.hd{border-bottom:3px double var(--line);padding-bottom:22px}.s-cover.dark,.s-close.dark{background:var(--bg);color:var(--ink);border:28px solid var(--bg2)}.s-cover.dark .muted,.s-close.dark .muted{color:var(--muted)}.s-cover .chip{color:var(--bg)}.tbl th{border-bottom-width:1px}.s-feel .hd,.s-pledge .hd{border-bottom-color:rgba(255,255,255,.18)}`
    case 'midnight': return `.slide:not(.dark){background:radial-gradient(1200px 700px at 85% -10%,rgba(154,168,255,.16),transparent 60%),radial-gradient(900px 600px at -10% 110%,rgba(110,231,192,.12),transparent 60%),var(--bg)}.eyebrow{text-shadow:0 0 18px rgba(110,231,192,.45)}.dark{background:radial-gradient(1000px 600px at 80% 0,rgba(110,231,192,.18),transparent 60%),var(--dark)}.chip{color:#0E1220}.tbl th{border-bottom-color:var(--accent)}.org-me{border-color:var(--accent2)}.pill{color:var(--accent)}.cnum{color:#0E1220}`
    case 'pop': return `.eyebrow{display:inline-block;align-self:flex-start;background:var(--accent);color:#fff;padding:6px 16px;transform:rotate(-1.5deg);border:3px solid #141414}.agenda-item,.member,.perms,.chat,.seat{background:var(--card)}.member.lead{background:var(--accent2)}.member.lead .kind{color:#FFE7A8}.band{border:4px solid #141414;box-shadow:8px 8px 0 #141414}.dark .chip{background:#FFE7A8;color:#141414}.org-me,.org-spec,.org-lead{border:4px solid #141414;box-shadow:6px 6px 0 #141414}.step{border:4px solid #141414;border-top-width:14px;margin-right:-4px;background:var(--card)}.step.now{background:#FFE7A8}.tbl{border:4px solid #141414}.tbl th{background:#FFE7A8;color:#141414}.fbox{background:rgba(255,255,255,.12)}.s-feel .flabel{color:#FFE7A8}.cover-sub{color:#FFE7A8}.perms-band,.vo-badge{border:4px solid #141414}.seat.ghost{border-color:#141414}`
    case 'minimal': return `.s-cover.dark,.s-close.dark{background:var(--bg);color:var(--ink)}.s-cover.dark .muted,.s-close.dark .muted{color:var(--muted)}.s-cover.dark .cover-sub{color:var(--accent)}.s-cover{border-left:24px solid var(--accent)}.eyebrow{color:var(--muted);font-weight:600;padding-left:16px;border-left:4px solid var(--accent)}.agenda-item,.member,.perms,.chat{background:var(--card)}.member.lead{background:var(--card);color:var(--ink);border:2px solid var(--ink)}.band{background:var(--bg2);color:var(--ink)}.band .chip{background:var(--ink)}.org-lead{background:var(--ink)}.step{border-top-width:3px}.step.now{background:transparent}.cover-sub{color:var(--muted)}.dark .cover-sub{color:#9fb6f7}`
    default: return `.cover-sub{color:#E9A27E}.dark .chip{background:#E9A27E;color:var(--dark)}.s-feel .flabel{color:#E9A27E}`
  }
}

const RUNTIME = `(()=>{const stage=document.getElementById('stage'),slides=[...document.querySelectorAll('.slide')],bar=document.getElementById('bar'),num=document.getElementById('num'),notes=document.getElementById('notes');let i=0;
function fit(){const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform='translate(-50%,-50%) scale('+s+')'}
function go(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,k)=>s.classList.toggle('on',k===i));bar.style.width=((i+1)/slides.length*100)+'%';num.textContent=(i+1)+' / '+slides.length;const a=slides[i].querySelector('aside');notes.textContent=a?a.textContent:'(이 장에는 발표자 노트가 없어요)';try{history.replaceState(null,'','#'+(i+1))}catch(e){}}
function fs(){const d=document;try{if(d.fullscreenElement)d.exitFullscreen();else d.documentElement.requestFullscreen().catch(()=>{})}catch(e){}}
addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key;if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){e.preventDefault();go(i+1)}else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();go(i-1)}else if(k==='Home')go(0);else if(k==='End')go(slides.length-1);else if(k==='f'||k==='F')fs();else if(k==='n'||k==='N')notes.classList.toggle('on')});
addEventListener('click',e=>{if(e.target.closest('#notes'))return;go(e.clientX>innerWidth/3?i+1:i-1)});
let tx=null;addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)go(dx<0?i+1:i-1);tx=null});
addEventListener('resize',fit);fit();const h=parseInt(location.hash.slice(1),10);go(Number.isFinite(h)?h-1:0);window.focus()})();`

export function renderDeck(talk, themeKey) {
  const key = themeKey || talk.theme || 'botanical'
  const base = THEMES[key]
  if (!base) throw new Error(`unknown theme: ${key}`)
  const theme = { ...base, key }
  const slides = buildSlides(talk)
  const title = `${talk.presenter?.name ? talk.presenter.name + ' · ' : ''}${talk.title || '발표'}`
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="talk-deck/0.3 theme=${key}">
<title>${esc(title.replace(/\n/g, ' '))}</title>
<link rel="stylesheet" href="${PRETENDARD}">
<style>${css(theme)}</style>
</head>
<body>
<div id="stage">
${slides.join('\n')}
</div>
<div id="ui"><div id="bar"></div></div><div id="num"></div><div id="help">← → 넘기기 · F 전체화면 · N 노트</div><div id="notes"></div>
<script>${RUNTIME}</script>
</body>
</html>
`
}
