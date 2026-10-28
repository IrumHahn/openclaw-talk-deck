// 발표 덱 테마 5종. 본문은 모두 Pretendard, 제목 글꼴과 색·모양만 다르다.
// 글꼴은 CDN(jsDelivr·Google Fonts)에서 받는다 — 베이스캠프 발표장 CSP 가 이 두 곳만 허용한다.

export const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
const BODY = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"

export const THEMES = {
  paper: {
    label: '페이퍼', mood: '따뜻한 미색 종이, 잡지 같은 차분함',
    fonts: ['https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap'],
    heading: "'Gowun Batang', Georgia, serif", headingWeight: 700,
    vars: { bg: '#F7F3EC', bg2: '#EFE8DC', ink: '#22201C', muted: '#5E574D', accent: '#B4471A', accent2: '#2F5D50', card: '#FFFDF8', line: '#DDD3C3', dark: '#22201C', darkInk: '#F7F3EC', radius: '6px', border: '1px solid #DDD3C3', shadow: 'none' },
  },
  midnight: {
    label: '미드나잇', mood: '어두운 무대, 네온 포인트 — 테크 발표 느낌',
    fonts: [],
    heading: BODY, headingWeight: 800,
    vars: { bg: '#0E1220', bg2: '#151B2E', ink: '#EEF1FA', muted: '#A3ACC6', accent: '#6EE7C0', accent2: '#9AA8FF', card: '#1A2136', line: '#2A3352', dark: '#060912', darkInk: '#EEF1FA', radius: '18px', border: '1px solid #2A3352', shadow: '0 0 0 1px rgba(110,231,192,.08), 0 20px 50px rgba(0,0,0,.35)' },
  },
  botanical: {
    label: '보태니컬', mood: '초록과 테라코타, 꽃집·공방 같은 따뜻함',
    fonts: ['https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap'],
    heading: "'Nanum Myeongjo', Georgia, serif", headingWeight: 800,
    vars: { bg: '#FAF7F2', bg2: '#F1ECE3', ink: '#1F2A24', muted: '#4A524C', accent: '#B5502B', accent2: '#2F6556', card: '#FFFFFF', line: '#E3DDD2', dark: '#1F2A24', darkInk: '#FAF7F2', radius: '20px', border: '1px solid #E3DDD2', shadow: 'none' },
  },
  pop: {
    label: '팝', mood: '원색 블록과 굵은 테두리, 에너지 넘치는 발표',
    fonts: ['https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap'],
    heading: "'Black Han Sans', 'Pretendard Variable', sans-serif", headingWeight: 400,
    vars: { bg: '#FFF7E2', bg2: '#FFE7A8', ink: '#141414', muted: '#3D3D3D', accent: '#E8432A', accent2: '#2450E8', card: '#FFFFFF', line: '#141414', dark: '#2450E8', darkInk: '#FFFFFF', radius: '14px', border: '4px solid #141414', shadow: '8px 8px 0 #141414' },
  },
  minimal: {
    label: '미니멀', mood: '흰 여백과 포인트 한 색, 깔끔한 보고서',
    fonts: [],
    heading: BODY, headingWeight: 700,
    vars: { bg: '#FBFBFA', bg2: '#F2F3F5', ink: '#111316', muted: '#5B616B', accent: '#2563EB', accent2: '#111316', card: '#FFFFFF', line: '#E3E5E9', dark: '#111316', darkInk: '#FBFBFA', radius: '10px', border: '1px solid #E3E5E9', shadow: 'none' },
  },
}

export const THEME_KEYS = Object.keys(THEMES)
export const BODY_FONT = BODY
