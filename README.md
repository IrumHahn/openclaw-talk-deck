# openclaw-talk-deck — 목요일 발표자료 스킬

OpenClaw 비서에게 **"1주차 발표자료 만들어줘"** 한 문장 → 업무 지도·팀(team.json)·대시보드·가상 오피스 기록을 모아 초안 → 참여 동기·소감·한 달 뒤 목표·다짐과 선언만 사람에게 묻기 → **테마 5종** 중 하나로 웹 슬라이드 HTML 한 장 → 승인 후 **실행학교 베이스캠프 발표장**에 게시하고 링크를 돌려준다.

```
VPS (OpenClaw)                                                         베이스캠프
my-work-map.md ┐                                                       POST /api/talk-deck (명단 이름 + 수정 열쇠)
team.json      ├→ collect.mjs → talk.json ─(사람 답)→ build.mjs → deck.html ─publish.mjs→ /s4/talks/ 발표장
dashboard/*.json┘                                       테마 5종 · Pretendard          /s4/talks/view?w=1&id=…
```

## 슬라이드 구성 (1인 10분)

표지 → 순서 → **참여 동기** → ① 업무 지도·구조도 → ② 멤버·앞으로의 팀 → ③ 대시보드 리뷰·계획 → **가상 오피스**(키트 CDN 배경 위에 우리 팀 캐릭터를 자리대로 앉힌 정지 화면, 채용 예정은 반투명) → ④ 소감 → **한 달 뒤 완성하고 싶은 것** → **다짐과 선언** → 감사. 비어 있는 장은 자동으로 빠진다.

## 설치

```bash
cd ~ && git clone https://github.com/IrumHahn/openclaw-talk-deck.git
openclaw skills install ./openclaw-talk-deck/skill/talk-deck --as talk-deck --agent main
openclaw skills list | grep talk-deck
```

채팅: `$talk_deck 스킬로 1주차 발표자료 만들어줘.`

## 테마 5종 (글꼴은 모두 Pretendard)

| 키 | 이름 | 느낌 |
|---|---|---|
| `paper` | 페이퍼 | 미색 종이, 잡지 |
| `midnight` | 미드나잇 | 다크 + 네온 |
| `botanical` | 보태니컬 | 초록·테라코타 |
| `pop` | 팝 | 원색 블록·굵은 테두리 |
| `minimal` | 미니멀 | 흰 여백 + 파랑 |

예시: `examples/flower/decks/` (가상의 꽃집 사장 1주차 발표) · 온라인 https://run-academy.pages.dev/s4/talks/examples/

## 스크립트 (Node 18+, 의존성 없음)

| 스크립트 | 하는 일 |
|---|---|
| `collect.mjs [--root dir] --out talk.json` | 재료 탐색($OPENCLAW_WORKSPACE, ~/.openclaw/workspace, /data/.openclaw/workspace) → 초안 + `ask` 목록 |
| `build.mjs --talk talk.json --theme key [--screenshot png] --out deck.html` | HTML 한 장. `--all-themes dir` 로 5종 동시. 비밀값 패턴이 있으면 거부 |
| `publish.mjs --deck deck.html --title "…" --week 1 --name 명단이름 [--dry-run]` | 발표장 게시(같은 주차 덮어쓰기). 베이스캠프 명단 이름으로 올리고, 처음 받은 수정 열쇠를 `~/.config/run-academy/talk.json` 에 저장해 다음부터 자동. 광장 토큰(rap_s4_…)이 있으면 그걸 우선 사용 |

발표 화면: ← → / 스페이스 넘기기, F 전체화면, N 발표자 노트, 클릭·스와이프.
덱은 외부 스크립트·저장소·네트워크를 쓰지 않는다(발표장 CSP 샌드박스에서 동작). 글꼴만 jsDelivr·Google Fonts 에서 받는다.

## 테스트

```bash
node --test tests/*.test.mjs
```

## 원칙

- 소감·이유는 사람 말 그대로. 기록에 없는 숫자·사실을 만들지 않는다.
- 게시 전 사용자 확인. 발표장은 같은 기수 모두가 본다.
- 토큰은 출력·기록하지 않는다.

MIT License
