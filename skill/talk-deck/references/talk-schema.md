# talk.json 형식

`collect.mjs` 가 만든 초안을 채운다. 비워 둔 칸·빈 배열은 그 장이 자동으로 빠진다. 줄바꿈은 `\n`.

```json
{
  "version": 1, "week": 1, "theme": "botanical", "course": "AI 에이전트 실전 1기", "date": "2026-10-29",
  "title": "꽃집 사장이\n팀장이 된 첫 주",
  "subtitle": "표지 아래 한 문장",
  "presenter": { "name": "김하늘", "about": "동네 꽃집 「오늘꽃」 운영" },
  "motivation": { "headline": "참여 동기 한 문장 (큰 인용문)", "why": "계기 한 줄" },

  "workMap": { "headline": "팀은 업무 지도에서 시작했습니다",
    "rows": [ { "task": "카톡 주문 정리", "frequency": "매일", "duration": "1시간", "delegation": 5, "owner": "다온" } ],
    "never": "절대 안 맡길 일과 이유" },

  "structure": { "headline": "...", "meLabel": "나 · 김하늘", "me": "방향 정하고 승인",
    "coordinator": { "name": "봄이", "role": "일 나누기 · 아침 보고", "emoji": "🌷" },
    "specialists": [ { "name": "다온", "role": "주문 정리", "emoji": "📋" } ],
    "base": "바탕: 내 VPS · 내 PC · HIA 기록",
    "permissions": { "auto": ["..."], "approve": ["..."], "never": ["..."] } },

  "members": { "headline": "...", "list": [ { "name": "봄이", "emoji": "🌷", "kind": "총괄", "role": "", "relation": "10년 같이 일한 실장님", "tone": "존댓말, 결론부터", "dislike": "확인 없이 끝났다고 하기", "firstTask": "아침 8시 보고" } ] },

  "selfIntro": { "headline": "...", "quote": "총괄 자기소개 3줄", "checks": [ { "ok": true, "text": "이름·호칭" }, { "ok": false, "text": "말이 길다" } ], "fix": "SOUL.md 에 '3줄 이내' 추가" },

  "futureTeam": { "headline": "...", "steps": [ { "when": "지금 · 1주차", "title": "3명", "desc": "..." }, { "when": "2주차", "title": "+ 연락 담당", "desc": "..." } ], "principle": "손님에게 닿는 일은 내가 승인" },

  "dashboard": { "headline": "...", "screenshot": null,
    "mini": { "name": "...", "emoji": "💐", "tagline": "...", "groups": [ { "label": "내 업무", "items": [ { "label": "...", "owner": "다온" } ] } ],
              "tiles": [ { "label": "...", "sub": "3건 진행 중" } ],
              "widget": { "title": "...", "bigLabel": "...", "bigValue": "6건", "sub": "...", "bars": [ { "label": "접수", "value": 3 } ], "list": [ { "title": "...", "meta": "11:00 · 접수" } ] } },
    "callouts": [ { "title": "내 업무 메뉴", "text": "..." }, { "title": "나의 위젯", "text": "..." }, { "title": "홈 한 줄", "text": "..." } ] },

  "review": { "headline": "...", "good": ["..."], "bad": ["..."] },
  "futureDashboard": { "headline": "...", "rows": [ { "when": "2주차", "menu": "카톡관리", "shows": "...", "owner": "..." } ], "widgetNext": "..." },
  "office": { "headline": "...", "why": "이 템플릿을 고른 이유", "template": "diorama|saas|rpg|control|building", "screenshot": null,
    "agents": [ { "name": "봄이", "role": "총괄", "sprite": "star", "coordinator": true } ],
    "planned": [ { "title": "연락 담당", "reason": "2주차 · 카톡 주문", "sprite": "coffee" } ] },
  "feelings": { "headline": "소감 한 문장", "stuck": "...", "surprise": "...", "nextWeek": "..." },
  "goal": { "headline": "한 달 뒤 완성하고 싶은 것 한 문장", "items": ["눈에 보이는 결과물 1", "2", "3"] },
  "pledge": { "pledges": ["다짐 1", "다짐 2", "다짐 3"], "declaration": "나는 4주 뒤, ○○ 하겠습니다.", "name": "(생략 시 발표자)", "date": "(생략 시 발표일)" },
  "closing": { "line": "감사합니다", "ask": "청중에게 부탁 한 줄" },
  "notes": { "cover": "말하기 예", "workmap": "...", "dashboard": "...", "feelings": "..." }
}
```

- `dashboard.mini` 는 collect 가 대시보드 `config.json`·`seed.json` 으로 채운다. 캡처를 받으면 `build.mjs --screenshot` 이 `screenshot` 을 넣고 mini 대신 보여준다(4MB 이하).
- `office` 는 collect 가 가상 오피스 `org.json`·`office.html` 로 채운다. `sprite` 12종: star chart gamepad pen laptop palette lens mirror sprout book camera coffee. 캡처는 `build.mjs --office-screenshot`.
- `notes` 키: cover · agenda · motivation · workmap · structure · members · selfintro · futureteam · dashboard · review · futuredash · office · feelings · goal · pledge · closing.
- 장 수 상한: 업무 지도 6행, 멤버 4명, 전문가 4명, 타임라인 4칸, 리뷰 각 4개, 대시보드 계획 5행.
