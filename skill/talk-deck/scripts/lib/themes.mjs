// 발표 덱 테마 5종. 글꼴은 모두 Pretendard 하나(제목·본문 같음) — 테마는 색·모양·굵기로만 다르다.
// 글꼴은 jsDelivr 에서 받는다 — 베이스캠프 발표장 CSP 가 허용하는 곳.

export const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
const FONT = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

export const THEMES = {
  paper: {
    label: '페이퍼', mood: '따뜻한 미색 종이, 잡지 같은 차분함',
    headingWeight: 800,
    vars: { bg: '#F7F3EC', bg2: '#EFE8DC', ink: '#22201C', muted: '#5E574D', accent: '#B4471A', accent2: '#2F5D50', card: '#FFFDF8', line: '#DDD3C3', dark: '#2A2622', darkInk: '#F7F3EC', soft: '#F3D9C9', radius: '8px', border: '1px solid #DDD3C3', shadow: 'none' },
  },
  midnight: {
    label: '미드나잇', mood: '어두운 무대, 네온 포인트 — 테크 발표 느낌',
    headingWeight: 800,
    vars: { bg: '#0E1220', bg2: '#161C30', ink: '#EEF1FA', muted: '#AAB3CC', accent: '#6EE7C0', accent2: '#9AA8FF', card: '#1A2136', line: '#2A3352', dark: '#060912', darkInk: '#EEF1FA', soft: '#1E3A3A', radius: '18px', border: '1px solid #2A3352', shadow: '0 0 0 1px rgba(110,231,192,.08), 0 20px 50px rgba(0,0,0,.35)' },
  },
  botanical: {
    label: '보태니컬', mood: '초록과 테라코타, 가게·공방 같은 따뜻함',
    headingWeight: 800,
    vars: { bg: '#FAF7F2', bg2: '#F1ECE3', ink: '#1F2A24', muted: '#4A524C', accent: '#B5502B', accent2: '#2F6556', card: '#FFFFFF', line: '#E3DDD2', dark: '#1F2A24', darkInk: '#FAF7F2', soft: '#F6DED2', radius: '20px', border: '1px solid #E3DDD2', shadow: 'none' },
  },
  pop: {
    label: '팝', mood: '원색 블록과 굵은 테두리, 에너지 넘치는 발표',
    headingWeight: 900,
    vars: { bg: '#FFF7E2', bg2: '#FFE7A8', ink: '#141414', muted: '#3D3D3D', accent: '#E8432A', accent2: '#2450E8', card: '#FFFFFF', line: '#141414', dark: '#2450E8', darkInk: '#FFFFFF', soft: '#FFD8CF', radius: '14px', border: '4px solid #141414', shadow: '8px 8px 0 #141414' },
  },
  minimal: {
    label: '미니멀', mood: '흰 여백과 포인트 한 색, 깔끔한 보고서',
    headingWeight: 700,
    vars: { bg: '#FBFBFA', bg2: '#F2F3F5', ink: '#111316', muted: '#5B616B', accent: '#2563EB', accent2: '#111316', card: '#FFFFFF', line: '#E3E5E9', dark: '#111316', darkInk: '#FBFBFA', soft: '#DCE7FD', radius: '10px', border: '1px solid #E3E5E9', shadow: 'none' },
  },
}

export const THEME_KEYS = Object.keys(THEMES)
export const BODY_FONT = FONT
