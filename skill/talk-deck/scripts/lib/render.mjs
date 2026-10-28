// talk.json(발표 내용) + 테마 → 한 장짜리 발표 HTML.
// 슬라이드는 1920×1080 캔버스를 화면 크기에 맞춰 줄인다. ←/→ 넘기기, F 전체화면, N 발표자 노트.
// 모든 글은 이스케이프한다(수강생 글이 HTML 로 해석되지 않게). 내용이 비어 있는 장은 자동으로 뺀다.
import { THEMES, PRETENDARD, BODY_FONT } from './themes.mjs'

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
const has = value => Array.isArray(value) ? value.some(has) : value !== undefined && value !== null && String(value).trim() !== ''
const lines = text => esc(text).replace(/\n/g, '<br>')

function head(eyebrow, title) {
  return `<header class="hd"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="title">${lines(title)}</h2></header>`
}

function slide(key, cls, body, notes) {
  return `<section class="slide ${cls}" data-key="${key}">${body}${has(notes) ? `<aside>${esc(notes)}</aside>` : ''}</section>`
}

// ---------- 장별 ----------

function cover(t) {
  return `<div class="cover-top"><span class="chip">${esc(t.week ? `${t.week}주차 발표` : '발표')}</span><span class="muted">${esc(t.course || 'AI 에이전트 실전 1기')}</span></div>
<div class="cover-main"><h1 class="cover-title">${lines(t.title)}</h1>${has(t.subtitle) ? `<p class="cover-sub">${lines(t.subtitle)}</p>` : ''}</div>
<div class="cover-foot"><p><b>${esc(t.presenter?.name)}</b>${has(t.presenter?.about) ? ` · ${esc(t.presenter.about)}` : ''}</p><p class="muted">${esc(t.date || '')}</p></div>`
}

function agenda(sections) {
  return `${head('발표 순서', '오늘 이야기할 네 가지')}<div class="agenda">${sections.map((s, i) => `<div class="card agenda-item"><p class="num">${i + 1}</p><h3>${esc(s.title)}</h3><p class="muted">${esc(s.desc)}</p></div>`).join('')}</div>`
}

function workMap(w) {
  const rows = (w.rows || []).slice(0, 6)
  const table = rows.length ? `<table class="tbl"><thead><tr><th>업무</th><th>빈도</th><th>시간</th><th>맡기고 싶은 정도</th><th>맡길 사람</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.task)}</td><td>${esc(r.frequency)}</td><td>${esc(r.duration)}</td><td>${has(r.delegation) ? `${esc(r.delegation)} / 5` : ''}</td><td>${esc(r.owner)}</td></tr>`).join('')}</tbody></table>` : ''
  const never = has(w.never) ? `<div class="band"><span class="chip">절대 안 맡김</span><p>${lines(w.never)}</p></div>` : ''
  return `${head('① 내가 생각하는 에이전트 팀', w.headline || '팀은 업무 지도에서 시작했습니다')}<div class="stack">${table}${never}</div>`
}

function orgChart(s) {
  const W = 1080
  const specs = (s.specialists || []).slice(0, 4)
  const n = specs.length
  const gap = 32
  const w = n ? Math.min(400, (W - (n - 1) * gap) / n) : 0
  const x0 = (W - (n * w + (n - 1) * gap)) / 2
  const box = (x, y, bw, bh, cls, name, role) => `<div class="org-box ${cls}" style="left:${x}px;top:${y}px;width:${bw}px;height:${bh}px"><b>${esc(name)}</b>${has(role) ? `<span>${esc(role)}</span>` : ''}</div>`
  const centers = specs.map((_, i) => x0 + i * (w + gap) + w / 2)
  const svgLines = [`<line x1="540" y1="100" x2="540" y2="170"/>`]
  if (n) {
    svgLines.push(`<line x1="540" y1="300" x2="540" y2="340"/>`)
    if (n > 1) svgLines.push(`<line x1="${centers[0]}" y1="340" x2="${centers[n - 1]}" y2="340"/>`)
    for (const c of centers) svgLines.push(`<line x1="${c}" y1="340" x2="${c}" y2="380"/>`)
  }
  const coord = s.coordinator || {}
  return `<div class="org" style="width:${W}px">
<svg class="org-lines" width="${W}" height="520" viewBox="0 0 ${W} 520" aria-hidden="true">${svgLines.join('')}</svg>
${box(370, 0, 340, 100, 'org-me', s.meLabel || '나', s.me || '방향 정하고 승인')}
${box(320, 170, 440, 130, 'org-lead', `${coord.emoji ? coord.emoji + ' ' : ''}${coord.name || '총괄'}`, coord.role)}
${specs.map((sp, i) => box(x0 + i * (w + gap), 380, w, 140, 'org-spec', `${sp.emoji ? sp.emoji + ' ' : ''}${sp.name}`, sp.role)).join('')}
${has(s.base) ? `<p class="org-base">${esc(s.base)}</p>` : ''}
</div>`
}

function permissions(p) {
  if (!p || ![p.auto, p.approve, p.never].some(has)) return ''
  const row = (label, cls, items) => has(items) ? `<div class="perm ${cls}"><p class="perm-label">${label}</p><p>${esc((items || []).join(', '))}</p></div>` : ''
  return `<div class="card perms"><h3>권한 3단계</h3>${row('자율 — 그냥 해도 됨', 'p-auto', p.auto)}${row('승인 — 내가 OK 해야 함', 'p-approve', p.approve)}${row('금지 — 절대 안 됨', 'p-never', p.never)}</div>`
}

function structure(s) {
  return `${head('① 구조도', s.headline || '나는 승인만, 총괄이 일을 나눠 줍니다')}<div class="row org-row">${orgChart(s)}${permissions(s.permissions)}</div>`
}

function members(m) {
  const list = (m.list || []).slice(0, 4)
  const cols = Math.max(1, Math.min(list.length, list.length === 4 ? 4 : 3))
  const field = (label, value) => has(value) ? `<p><b>${label}</b> ${esc(value)}</p>` : ''
  return `${head('② 팀 멤버 소개', m.headline || '같이 일하고 싶은 사람으로 만들었습니다')}<div class="members" style="grid-template-columns:repeat(${cols},1fr)">${list.map((a, i) => `<div class="card member ${i === 0 ? 'lead' : ''}"><p class="kind">${esc(a.kind || (i === 0 ? '총괄' : '전문가'))}</p><h3 class="mname">${esc(a.emoji ? a.emoji + ' ' : '')}${esc(a.name)}</h3><div class="mfields">${field('역할', a.role)}${field('관계', a.relation)}${field('말투', a.tone)}${field('싫어하는 것', a.dislike)}${field('첫 과제', a.firstTask)}</div></div>`).join('')}</div>`
}

function selfIntro(s) {
  const checks = (s.checks || []).slice(0, 5)
  return `${head('② 총괄 자기소개 확인', s.headline || '"네 소개 해줘"에 돌아온 대답')}<div class="row">
<div class="chat card"><p class="bubble me">네 소개 해줘</p><p class="bubble bot">${lines(s.quote)}</p></div>
<div class="checks"><h3>인터뷰대로 나왔나?</h3>${checks.map(c => `<p class="check ${c.ok === false ? 'no' : 'ok'}"><span>${c.ok === false ? '고침' : '맞음'}</span>${esc(c.text)}</p>`).join('')}${has(s.fix) ? `<p class="fix">${lines(s.fix)}</p>` : ''}</div></div>`
}

function futureTeam(f) {
  const steps = (f.steps || []).slice(0, 4)
  return `${head('② 앞으로 구성하고 싶은 팀', f.headline || '4주 뒤 우리 팀의 모습')}<div class="timeline" style="grid-template-columns:repeat(${Math.max(1, steps.length)},1fr)">${steps.map((s, i) => `<div class="step ${i === 0 ? 'now' : ''}"><p class="when">${esc(s.when)}</p><h3>${esc(s.title)}</h3><p class="muted">${lines(s.desc)}</p></div>`).join('')}</div>${has(f.principle) ? `<p class="principle">원칙 — <b>${esc(f.principle)}</b></p>` : ''}`
}

function miniDashboard(d) {
  const groups = (d.groups || []).slice(0, 4)
  const tiles = (d.tiles || []).slice(0, 6)
  const wg = d.widget
  const widget = wg ? `<div class="mini-widget"><p class="mini-wtitle">${esc(wg.title || '나의 위젯')}</p><div class="mini-wbody"><div><p class="mini-blabel">${esc(wg.bigLabel || '')}</p><p class="mini-big">${esc(wg.bigValue ?? '')}</p>${has(wg.sub) ? `<p class="mini-sub">${esc(wg.sub)}</p>` : ''}${(wg.bars || []).length ? `<div class="mini-bars">${(() => { const max = Math.max(1, ...wg.bars.map(b => Number(b.value) || 0)); return wg.bars.slice(0, 5).map(b => `<div class="mini-bar"><span>${esc(b.label)}</span><i><em style="width:${((Number(b.value) || 0) / max) * 100}%"></em></i><b>${esc(b.value)}</b></div>`).join('') })()}</div>` : ''}</div>${(wg.list || []).length ? `<ul class="mini-list">${wg.list.slice(0, 4).map((x, i) => `<li class="${i === 0 ? 'first' : ''}"><b>${esc(x.title)}</b><span>${esc(x.meta)}</span></li>`).join('')}</ul>` : ''}</div></div>` : ''
  return `<div class="mini">
<div class="mini-side"><p class="mini-logo">${esc(d.emoji || '')} ${esc(d.name || '내 AI 오피스')}</p>${groups.map(g => `<p class="mini-group">${esc(g.label)}</p>${(g.items || []).slice(0, 5).map(it => `<p class="mini-item">${esc(it.label)}${has(it.owner) ? `<span>${esc(it.owner)}</span>` : ''}</p>`).join('')}`).join('')}</div>
<div class="mini-main"><p class="mini-name">${esc(d.name || '내 AI 오피스')}</p>${has(d.tagline) ? `<p class="mini-tag">${esc(d.tagline)}</p>` : ''}
<div class="mini-tiles">${tiles.map(t => `<div class="mini-tile"><b>${esc(t.label)}</b><span>${esc(t.sub)}</span></div>`).join('')}</div>${widget}</div></div>`
}

function dashboard(d) {
  const visual = has(d.screenshot)
    ? `<img class="shot" src="${esc(d.screenshot)}" alt="내 대시보드 화면 캡처">`
    : `<div class="shot-wrap">${miniDashboard(d.mini || {})}<p class="shot-note">대시보드 데이터(config·seed)로 다시 그린 화면</p></div>`
  const callouts = (d.callouts || []).slice(0, 3)
  return `${head('③ 대시보드 리뷰', d.headline || '열자마자 보이는 것')}<div class="row dash-row">${visual}<div class="callouts">${callouts.map((c, i) => `<div><p class="callout-t">${'❶❷❸'[i]} ${esc(c.title)}</p><p class="muted">${lines(c.text)}</p></div>`).join('')}</div></div>`
}

function review(r) {
  const col = (cls, title, items) => `<div class="card rv ${cls}"><h3>${title}</h3><ul>${(items || []).slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`
  return `${head('③ 써 보니', r.headline || '며칠 써 본 솔직한 리뷰')}<div class="two">${col('good', '좋았던 점', r.good)}${col('bad', '아쉬운 점', r.bad)}</div>`
}

function futureDash(f) {
  const rows = (f.rows || []).slice(0, 5)
  return `${head('③ 앞으로 구성하고 싶은 대시보드', f.headline || '빈 메뉴가 하나씩 채워지는 계획')}<div class="stack">${rows.length ? `<table class="tbl"><thead><tr><th>언제</th><th>추가·채울 메뉴</th><th>무엇이 보이나</th><th>담당</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.when)}</td><td>${esc(r.menu)}</td><td>${esc(r.shows)}</td><td>${esc(r.owner)}</td></tr>`).join('')}</tbody></table>` : ''}${has(f.widgetNext) ? `<div class="band"><span class="chip">위젯 다음 버전</span><p>${lines(f.widgetNext)}</p></div>` : ''}</div>`
}

function feelings(f) {
  const box = (label, text) => has(text) ? `<div class="card fbox"><p class="flabel">${label}</p><p>${lines(text)}</p></div>` : ''
  return `<header class="hd"><p class="eyebrow">④ 1주차 소감</p><h2 class="title big-quote">${lines(f.headline)}</h2></header><div class="fgrid">${box('막힌 곳', f.stuck)}${box('놀란 순간', f.surprise)}${box('다음 주에 맡길 일', f.nextWeek)}</div>`
}

function closing(c, t) {
  return `<div class="close"><h2 class="cover-title">${lines(c.line || '감사합니다')}</h2>${has(c.ask) ? `<p class="cover-sub">${lines(c.ask)}</p>` : ''}<p class="muted">${esc(t.presenter?.name || '')}</p></div>`
}

// ---------- 조립 ----------

export function buildSlides(t) {
  const notes = t.notes || {}
  const out = []
  const sections = []
  const add = (key, cls, body) => out.push(slide(key, cls, body, notes[key]))
  if (has(t.workMap?.rows) || has(t.structure?.coordinator?.name)) sections.push({ title: '내가 생각하는 에이전트 팀과 구조도', desc: '업무 지도 → 왜 이런 팀인가' })
  if (has(t.members?.list)) sections.push({ title: '팀 멤버 소개 + 앞으로 만들 팀', desc: '지금의 팀 → 4주 뒤 모습' })
  if (has(t.dashboard) || has(t.review?.good) || has(t.futureDashboard?.rows)) sections.push({ title: '대시보드 리뷰 + 앞으로 만들 대시보드', desc: '나만 가진 메뉴와 위젯' })
  if (has(t.feelings?.headline)) sections.push({ title: '1주차 소감', desc: '막힌 곳 · 놀란 순간 · 다음 주' })

  add('cover', 's-cover dark', cover(t))
  if (sections.length > 1 && t.agenda !== false) add('agenda', 's-agenda', agenda(sections))
  if (has(t.workMap?.rows) || has(t.workMap?.never)) add('workmap', '', workMap(t.workMap))
  if (has(t.structure?.coordinator?.name)) add('structure', '', structure(t.structure))
  if (has(t.members?.list)) add('members', '', members(t.members))
  if (has(t.selfIntro?.quote)) add('selfintro', '', selfIntro(t.selfIntro))
  if (has(t.futureTeam?.steps)) add('futureteam', '', futureTeam(t.futureTeam))
  if (t.dashboard && (has(t.dashboard.screenshot) || has(t.dashboard.mini?.name) || has(t.dashboard.mini?.groups))) add('dashboard', 's-dash', dashboard(t.dashboard))
  if (has(t.review?.good) || has(t.review?.bad)) add('review', '', review(t.review))
  if (has(t.futureDashboard?.rows) || has(t.futureDashboard?.widgetNext)) add('futuredash', '', futureDash(t.futureDashboard))
  if (has(t.feelings?.headline)) add('feelings', 's-feel dark', feelings(t.feelings))
  if (t.closing !== false) add('closing', 's-close dark', closing(t.closing || {}, t))
  return out
}

function css(theme) {
  const v = theme.vars
  return `:root{--bg:${v.bg};--bg2:${v.bg2};--ink:${v.ink};--muted:${v.muted};--accent:${v.accent};--accent2:${v.accent2};--card:${v.card};--line:${v.line};--dark:${v.dark};--dark-ink:${v.darkInk};--radius:${v.radius};--border:${v.border};--shadow:${v.shadow};--hfont:${theme.heading};--hweight:${theme.headingWeight};--bfont:${BODY_FONT}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#0b0b0c;overflow:hidden;font-family:var(--bfont);-webkit-font-smoothing:antialiased}
#stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:center;transform:translate(-50%,-50%)}
.slide{position:absolute;inset:0;display:none;flex-direction:column;gap:44px;padding:110px 128px 120px;background:var(--bg);color:var(--ink);overflow:hidden}
.slide.on{display:flex}
.slide aside{display:none}
.dark{background:var(--dark);color:var(--dark-ink)}
.dark .muted{color:color-mix(in srgb,var(--dark-ink) 70%,transparent)}
.muted{color:var(--muted)}
.hd{display:flex;flex-direction:column;gap:14px}
.eyebrow{font-size:28px;font-weight:700;color:var(--accent);letter-spacing:.01em}
.title{font-family:var(--hfont);font-weight:var(--hweight);font-size:76px;line-height:1.18;letter-spacing:-.01em}
h3{font-size:40px;font-weight:700;line-height:1.3}
p,li,td,th{font-size:32px;line-height:1.5}
.slide>.hd+*{margin-top:auto;margin-bottom:auto}
.card{background:var(--card);border:var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:36px}
.chip{display:inline-block;font-size:24px;font-weight:700;background:var(--accent);color:var(--bg);padding:6px 18px;border-radius:999px;white-space:nowrap}
.row{display:flex;gap:44px;align-items:flex-start}
.stack{display:flex;flex-direction:column;gap:32px}
.s-cover{justify-content:space-between}
.cover-top{display:flex;gap:18px;align-items:center}.cover-top .muted{font-size:26px}
.cover-main{display:flex;flex-direction:column;gap:30px}
.cover-title{font-family:var(--hfont);font-weight:var(--hweight);font-size:116px;line-height:1.15;letter-spacing:-.02em}
.cover-sub{font-size:40px;line-height:1.45;color:var(--accent);max-width:1500px}
.cover-foot{display:flex;justify-content:space-between;align-items:flex-end}.cover-foot p{font-size:30px}
.agenda{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.agenda-item{display:flex;flex-direction:column;gap:14px;background:var(--bg2)}
.agenda-item .num{font-size:40px;font-weight:800;color:var(--accent)}.agenda-item p.muted{font-size:28px}.agenda-item{padding:44px 36px;gap:18px}
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-size:28px;color:var(--muted);text-align:left;font-weight:700;padding:14px 18px;border-bottom:2px solid var(--ink)}
.tbl td{padding:24px 18px;border-bottom:1px solid var(--line)}
.tbl tbody tr:nth-child(even){background:var(--bg2)}
.band{display:flex;gap:24px;align-items:center;background:var(--dark);color:var(--dark-ink);padding:28px 40px;border-radius:var(--radius)}
.band p{font-size:34px}
.org{position:relative;height:600px;flex:none}
.org-lines{position:absolute;left:0;top:0;color:var(--muted)}.org-lines line{stroke:currentColor;stroke-width:3}
.org-box{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;border-radius:var(--radius);padding:10px}
.org-box b{font-size:36px}.org-box span{font-size:26px;line-height:1.35}
.org-me{background:var(--bg2);border:2px solid var(--ink)}
.org-lead{background:var(--dark);color:var(--dark-ink)}.org-lead span{color:var(--accent)}
.org-spec{background:var(--card);border:2px solid var(--accent2);box-shadow:var(--shadow)}.org-spec b{color:var(--accent2)}.org-spec span{color:var(--muted)}
.org-base{position:absolute;left:0;right:0;top:548px;text-align:center;font-size:24px;color:var(--muted);background:var(--bg2);border-radius:12px;padding:8px 16px}
.perms{flex:1;display:flex;flex-direction:column;gap:20px;background:var(--bg2)}
.perm-label{font-size:30px;font-weight:700}.perm p:last-child{font-size:28px;color:var(--muted)}
.p-auto .perm-label{color:var(--accent2)}.p-approve .perm-label{color:var(--accent)}
.members{display:grid;gap:24px}
.member{display:flex;flex-direction:column;gap:14px;background:var(--bg2)}
.member.lead{background:var(--dark);color:var(--dark-ink)}
.member .kind{font-size:24px;font-weight:700;color:var(--accent)}
.mname{font-family:var(--hfont);font-weight:var(--hweight);font-size:58px}
.mfields p{font-size:29px;line-height:1.6}
.member.lead .mfields p{color:color-mix(in srgb,var(--dark-ink) 85%,transparent)}
.chat{flex:1;display:flex;flex-direction:column;gap:22px;background:var(--bg2)}
.bubble{font-size:33px;padding:18px 26px;border-radius:20px;max-width:880px}
.bubble.me{align-self:flex-end;background:var(--dark);color:var(--dark-ink)}
.bubble.bot{align-self:flex-start;background:var(--card);border:var(--border)}
.checks{width:560px;display:flex;flex-direction:column;gap:18px}
.check{display:flex;gap:14px;align-items:center;font-size:32px}
.check span{font-size:22px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--accent2);color:var(--bg);white-space:nowrap}
.check.no span{background:var(--accent)}
.fix{font-size:28px;background:var(--bg2);padding:16px 20px;border-radius:12px;color:var(--muted)}
.timeline{display:grid}
.step{display:flex;flex-direction:column;gap:14px;padding:32px;border-top:8px solid var(--accent2)}
.step.now{border-top-color:var(--ink);background:var(--bg2)}
.step:last-child{border-top-color:var(--accent)}
.when{font-size:28px;font-weight:700;color:var(--accent2)}.step p.muted{font-size:29px}.step{padding:40px 34px}
.principle{font-size:36px;margin-top:-20px;color:var(--accent2)}
.dash-row{align-items:stretch}
.shot{width:1160px;height:650px;object-fit:contain;background:var(--bg2);border:var(--border);border-radius:12px;flex:none}
.shot-wrap{position:relative;flex:none}
.shot-note{position:absolute;right:14px;bottom:10px;font-size:20px;color:var(--muted);background:var(--card);padding:2px 10px;border-radius:8px}
.callouts{flex:1;display:flex;flex-direction:column;gap:30px}
.callout-t{font-size:32px;font-weight:700;color:var(--accent)}.callouts p.muted{font-size:28px}
.mini{width:1160px;height:650px;display:flex;background:#F6F5F1;color:#1d211e;border:2px solid var(--line);border-radius:14px;overflow:hidden;font-family:var(--bfont)}
.mini p{line-height:1.35}
.mini-side{width:250px;background:#EAEAE3;padding:22px 16px;display:flex;flex-direction:column;gap:8px}
.mini-logo{font-size:20px;font-weight:800;margin-bottom:8px}
.mini-group{font-size:15px;color:#7a7f78;margin-top:10px}
.mini-item{font-size:17px;padding:5px 8px;border-radius:6px;display:flex;justify-content:space-between;gap:6px}
.mini-item span{font-size:13px;color:#7a7f78;white-space:nowrap}
.mini-main{flex:1;padding:26px 30px;display:flex;flex-direction:column;gap:14px;min-width:0}
.mini-name{font-family:var(--hfont);font-size:34px;font-weight:700}
.mini-tag{font-size:17px;color:#5c635d;margin-top:-8px}
.mini-tiles{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dcdcd2;border-radius:8px;overflow:hidden}
.mini-tile{padding:12px 14px;border-right:1px solid #dcdcd2;border-bottom:1px solid #dcdcd2;background:#fbfbf8;display:flex;flex-direction:column;gap:4px}
.mini-tile b{font-size:17px}.mini-tile span{font-size:14px;color:#6b706a}
.mini-widget{border:1px solid #dcdcd2;border-radius:8px;background:#fbfbf8;padding:16px 18px;display:flex;flex-direction:column;gap:10px;flex:1;min-height:0}
.mini-wtitle{font-size:19px;font-weight:700}
.mini-wbody{display:grid;grid-template-columns:1fr 1.1fr;gap:18px}
.mini-blabel{font-size:14px;color:#6b706a;font-weight:600}
.mini-big{font-size:52px;font-weight:800;color:var(--accent2);line-height:1.05}
.mini-sub{font-size:15px}
.mini-bars{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.mini-bar{display:grid;grid-template-columns:78px 1fr 22px;align-items:center;gap:8px}
.mini-bar span,.mini-bar b{font-size:14px}
.mini-bar i{display:block;height:8px;background:#e1e1d8;border-radius:4px;overflow:hidden}.mini-bar em{display:block;height:100%;background:var(--accent2)}
.mini-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.mini-list li{display:flex;justify-content:space-between;gap:8px;font-size:15px;padding:7px 10px;border:1px solid #dcdcd2;border-radius:6px;background:#fff;line-height:1.3}
.mini-list li span{color:#6b706a;white-space:nowrap;font-size:14px}.mini-list li.first{border-color:var(--accent)}.mini-list li.first span{color:var(--accent);font-weight:700}
.two{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.rv{display:flex;flex-direction:column;gap:20px}
.rv.good h3{color:var(--accent2)}.rv.bad h3{color:var(--accent)}
.rv ul{padding-left:40px;display:flex;flex-direction:column;gap:16px}.rv li{font-size:34px}.rv{padding:48px}
.s-feel{justify-content:space-between}
.big-quote{font-size:66px;line-height:1.3}
.fgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.fbox p{font-size:32px}.fbox{background:color-mix(in srgb,var(--dark-ink) 8%,transparent);border-color:transparent;box-shadow:none;display:flex;flex-direction:column;gap:12px}
.flabel{font-size:30px;font-weight:700;color:var(--accent)}
.s-close{justify-content:center}
.close{display:flex;flex-direction:column;gap:30px}
#ui{position:fixed;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.08);z-index:5}
#bar{height:100%;width:0;background:${v.accent};transition:width .25s}
#num{position:fixed;right:16px;bottom:12px;font:600 13px/1 var(--bfont);color:rgba(255,255,255,.55);background:rgba(0,0,0,.35);padding:5px 9px;border-radius:999px;z-index:5}
#notes{position:fixed;left:16px;right:16px;bottom:16px;max-height:34vh;overflow:auto;background:rgba(15,15,18,.92);color:#f2f2f2;font:16px/1.6 var(--bfont);padding:16px 20px;border-radius:12px;display:none;z-index:6;white-space:pre-wrap}
#notes.on{display:block}
#help{position:fixed;left:16px;bottom:12px;font:12px/1 var(--bfont);color:rgba(255,255,255,.45);z-index:5}
${themeExtra(theme)}`
}

function themeExtra(theme) {
  switch (theme.key) {
    case 'paper': return `.s-cover.dark,.s-close.dark{background:var(--bg);color:var(--ink);border:28px solid var(--bg2)}.s-cover.dark .muted,.s-close.dark .muted{color:var(--muted)}.s-cover .chip{color:var(--bg)}.s-cover .cover-title{font-size:124px}.hd{border-bottom:3px double var(--line);padding-bottom:22px}.s-cover .cover-title{font-style:normal}.tbl th{border-bottom-width:1px}`
    case 'midnight': return `.slide:not(.dark){background:radial-gradient(1200px 700px at 85% -10%,rgba(154,168,255,.16),transparent 60%),radial-gradient(900px 600px at -10% 110%,rgba(110,231,192,.12),transparent 60%),var(--bg)}.eyebrow{text-shadow:0 0 18px rgba(110,231,192,.45)}.dark{background:radial-gradient(1000px 600px at 80% 0,rgba(110,231,192,.18),transparent 60%),var(--dark)}.chip{color:#0E1220}.tbl th{border-bottom-color:var(--accent)}.org-me{border-color:var(--accent2)}`
    case 'pop': return `.eyebrow{display:inline-block;align-self:flex-start;background:var(--accent);color:#fff;padding:6px 16px;transform:rotate(-1.5deg);border:3px solid #141414}.title{font-size:74px}.agenda-item,.member,.perms,.chat{background:var(--card)}.member.lead{background:var(--accent2)}.member.lead .kind{color:#FFE7A8}.band{border:4px solid #141414;box-shadow:8px 8px 0 #141414}.dark .chip{background:#FFE7A8;color:#141414}.org-me,.org-spec,.org-lead{border:4px solid #141414;box-shadow:6px 6px 0 #141414}.step{border:4px solid #141414;border-top-width:14px;margin-right:-4px;background:var(--card)}.step.now{background:#FFE7A8}.tbl{border:4px solid #141414}.tbl th{background:#FFE7A8;color:#141414}.fbox{background:rgba(255,255,255,.12)}.s-feel .flabel{color:#FFE7A8}.cover-sub{color:#FFE7A8}`
    case 'minimal': return `.s-cover.dark,.s-close.dark{background:var(--bg);color:var(--ink)}.s-cover.dark .muted,.s-close.dark .muted{color:var(--muted)}.s-cover.dark .cover-sub{color:var(--accent)}.s-cover{border-left:24px solid var(--accent)}.eyebrow{color:var(--muted);font-weight:600;padding-left:16px;border-left:4px solid var(--accent)}.title{font-weight:700}.cover-title{font-weight:800}.agenda-item,.member,.perms,.chat{background:var(--card)}.member.lead{background:var(--card);color:var(--ink);border:2px solid var(--ink)}.member.lead .mfields p{color:var(--muted)}.band{background:var(--bg2);color:var(--ink)}.band .chip{background:var(--ink)}.org-lead{background:var(--ink)}.step{border-top-width:3px}.step.now{background:transparent}.cover-sub{color:var(--muted)}.dark .cover-sub{color:#9fb6f7}`
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
  const fontLinks = [PRETENDARD, ...theme.fonts].map(href => `<link rel="stylesheet" href="${href}">`).join('\n')
  const title = `${talk.presenter?.name ? talk.presenter.name + ' · ' : ''}${talk.title || '발표'}`
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="talk-deck/0.1 theme=${key}">
<title>${esc(title)}</title>
${fontLinks}
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
