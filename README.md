# Routine

반복되는 일상 루틴을 만들고, 오늘의 실행과 완료 기록을 관리하는 habit tracking application입니다.

## 개요

Routine은 이메일 기반 인증 후 루틴을 생성하고 일정에 따라 오늘 할 일을 확인할 수 있습니다. 완료 기록, 연속 달성(streak), 월별 기록과 통계를 통해 꾸준한 실행 흐름을 확인할 수 있습니다.

## 주요 기능

- 이메일/비밀번호 회원가입, 로그인, 비밀번호 재설정
- 루틴 생성, 수정, 보관
- `Daily`, `Specific Days`, `Weekly Target` 일정 설정
- 오늘 루틴 확인 및 완료/완료 취소
- 루틴별 streak와 최근 완료 기록
- 월별 완료 기록 캘린더
- 최근 활동과 루틴별 통계
- 반응형 모바일/데스크톱 UI
- Light/Dark/System 테마

## 일정 유형

- `Daily`: 매일 수행하는 루틴
- `Specific Days`: 선택한 요일에 수행하는 루틴
- `Weekly Target`: 한 주 동안 달성할 목표 횟수를 기준으로 관리하는 루틴

Weekly Target은 특정 날짜를 자동으로 미완료로 해석하는 방식이 아니라 주간 목표 개념으로 사용됩니다.

## 기술 스택

- Next.js 16.3.4 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 기반 UI components
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Lucide React
- ESLint 9
- Prettier

## 라우트

### 공개 라우트

| Route | Description              |
| ----- | ------------------------ |
| `/`   | 서비스 소개 및 진입 화면 |

### 인증 라우트

| Route                   | Description                |
| ----------------------- | -------------------------- |
| `/auth/login`           | 로그인                     |
| `/auth/sign-up`         | 회원가입                   |
| `/auth/forgot-password` | 비밀번호 재설정 링크 요청  |
| `/auth/update-password` | 새 비밀번호 설정           |
| `/auth/sign-up-success` | 회원가입 확인 안내         |
| `/auth/error`           | 인증 오류 안내             |
| `/auth/confirm`         | 이메일 인증 callback route |

### 인증 필요 라우트

| Route          | Description            |
| -------------- | ---------------------- |
| `/dashboard`   | 오늘의 루틴            |
| `/habits`      | 루틴 생성 및 관리      |
| `/habits/[id]` | 루틴 상세 및 완료 기록 |
| `/calendar`    | 월별 완료 기록         |
| `/stats`       | 루틴 통계              |
| `/review`      | 주간/월간 기록 리뷰    |

## 프로젝트 구조

```text
app/
  (app)/              인증된 앱 화면
  auth/               인증 route 및 callback

components/
  ui/                 공통 shadcn/ui 기반 components
  *-form.tsx          인증 및 루틴 form
  *-view.tsx          주요 화면의 client UI

lib/
  habits/             루틴 query, action, schedule, completion, 통계 로직
  supabase/           Supabase client 및 server/proxy 유틸리티

supabase/
  migrations/         database migration
```

## 버전 기록

### V1.0 — Initial Release

- 이메일/비밀번호 인증 및 보호된 앱 route
- 루틴 생성, 수정, 보관
- `Daily`, `Specific Days`, `Weekly Target` 일정 지원
- 오늘의 루틴 조회 및 완료/완료 취소
- 루틴 상세 화면의 streak와 최근 완료 기록
- 7일/30일 완료율
- 월별 완료 기록과 날짜 선택
- 활성 루틴, 완료 횟수, 완료율, streak 기반 통계
- Supabase 기반 데이터 저장 및 인증 흐름

### V1.1 — UI/UX Improvement

기존 V1의 authentication flow, database schema, Supabase query와 habit scheduling/business logic을 유지하면서 전체 UI/UX와 상태 피드백을 개선했습니다.

#### UI Foundation

- `AppShell`, `AppHeader`, `PageContainer`, `PageHeader` 도입
- 데스크톱 상단 navigation 및 모바일 bottom navigation 정리
- 공통 `LoadingState`, `ErrorState`, `EmptyState` 추가
- semantic theme token과 light/dark UI 일관성 개선
- ESLint, Prettier, VSCode 저장 시 formatting 환경 정리

#### Today Dashboard

- 오늘 날짜와 진행 상황을 우선적으로 보여주는 구조
- 루틴별 완료 toggle과 row 단위 pending 상태
- 완료 처리 오류 및 초기 조회 오류 처리
- 모바일 touch target과 progress UI 개선

#### Habits

- 생성 form 기본 숨김 및 명시적 추가 흐름
- 루틴별 Dropdown action menu
- 수정/보관 UX와 archive feedback 개선
- 긴 루틴 이름과 모바일 action 영역 대응

#### Habit Detail

- 루틴 identity, schedule, 상태, metric 정보 hierarchy 개선
- 현재 연속, 최근 7일/30일 지표 정리
- 최근 30일 history grid 및 완료 기록 목록 추가
- Daily와 Specific Days의 날짜 상태를 구분
- Weekly Target의 완료 기록 없는 날짜를 일별 실패로 표시하지 않음
- archived 이후 날짜를 예정 없음으로 처리

#### Calendar

- 한국어 월/요일 표시와 월 이동 navigation
- 선택 날짜와 오늘 상태 구분
- completion count 중심의 7열 calendar grid
- 선택 날짜의 완료 기록 목록
- schedule metadata가 없는 calendar query에서 미완료 상태를 추측하지 않음

#### Stats

- 핵심 summary metric과 최근 7일 completion activity
- habit별 최근 30일 rate/streak
- 모바일 대응 및 accessible progressbar
- 활성 루틴이 없는 상태와 통계 표시 상태의 문구 구분

#### Public / Auth

- landing을 간결한 hero 및 CTA 구조로 개선
- auth route들을 공통 `AuthShell` 기반으로 정리
- `ThemeSwitcher`를 public/auth 경험에 일관되게 제공
- 로그인, 회원가입, 비밀번호 관련 사용자 문구 한국어 통일
- autocomplete, error/status accessibility, 모바일 form UX 개선
- 기존 Supabase authentication flow와 redirect 유지

#### Quality / Accessibility

- 320~390px 모바일 화면 대응
- dark mode semantic tokens, focus-visible, ARIA 개선
- 공통 loading/error/empty states
- format/lint/typecheck/build validation 환경 정리

### V1.2 — Product Polish

V1.1의 기능과 business logic을 유지하면서 핵심 interaction, 상태 피드백, form UX, Calendar/Stats 사용성, responsive/accessibility 완성도를 높였습니다.

#### Today

- 완료/완료 취소 optimistic interaction
- 클릭 직후 완료 상태와 진행률 즉시 반영
- habit별 pending 상태 관리 및 동일 habit 중복 mutation 방지
- 서로 다른 habit의 동시 interaction 지원
- mutation 실패 시 해당 habit만 rollback
- 모든 pending mutation 종료 후 최종 server reconciliation
- 날짜 변경 중 이전 mutation/response가 새 날짜 화면을 덮어쓰지 않도록 stale response guard 강화

#### Feedback / State UX

- 공통 `FormMessage` 도입
- loading state spinner 및 status semantics 개선
- error / success / info feedback 표현 일관성 개선
- Today / Habits / Auth feedback 통일

#### Habit Form / Detail

- Create/Edit form의 field-level validation 개선
- `Specific Days`에서 요일을 하나도 선택하지 않은 경우 client validation
- schedule input helper text 개선
- weekday touch target 및 선택 상태 개선
- 완료 기록이 있는 루틴의 반복 설정/시작일 변경 제한 설명 강화
- archive action 위치 정리
- archived 상태 설명 개선
- Habit Detail hierarchy/readability 개선

#### Calendar

- 오늘 shortcut 추가
- 오늘 / 선택 날짜 상태 구분 강화
- 완료 기록 있음/없음 indicator 및 legend 개선
- 날짜별 완료 기록 표시 개선
- month navigation 모바일 layout 개선
- 날짜 button focus-visible 개선

Calendar는 completion record 중심으로 동작하며, 예정 루틴·missed habit·쉬는 날 계산이나 Arrow key grid navigation은 추가하지 않았습니다.

#### Stats

- low-data UX 개선
- 완료 기록이 없거나 적은 상태의 안내 추가
- 최근 30일 통계 기준 설명 강화
- `rate30Denominator === 0`인 경우 `0%` 대신 데이터 없음 상태(`—`)로 구분
- 실제 평가 데이터가 있는 0%와 계산할 데이터가 없는 상태 구분
- 데이터가 없는 경우 불필요한 progressbar 미표시
- 기존 weekly target / rate / streak 계산 semantics 유지

#### Responsive / Accessibility

- mobile navigation touch target 및 width distribution 개선
- navigation `aria-current` 유지/점검
- Calendar date focus-visible 강화
- custom edit dialog keyboard accessibility 개선
- dialog open 시 내부 focus 이동
- Tab / Shift+Tab focus trap
- Escape close 및 dialog close 후 menu trigger로 focus return
- hidden input이 focus 대상으로 잡히지 않도록 개선

#### Quality

- V1.2 전체 regression audit
- Today race-condition 재검수
- Form/Dialog/Calendar/Stats semantic audit
- responsive/accessibility audit
- `git diff --check`
- ESLint
- TypeScript typecheck

## V1.1에서 변경하지 않은 것

V1.1은 UI/UX release이며 authentication flow, database schema, Supabase query 구조 및 루틴 scheduling/business logic은 유지했습니다.

## V2.0 완료 기록 메모

- 각 완료 기록에 선택적으로 메모를 연결할 수 있습니다.
- Today: 루틴 완료 후 메모를 추가하거나 수정할 수 있습니다.
- Habit Detail: 과거 완료 기록의 메모를 조회, 추가, 수정, 삭제할 수 있습니다.
- Calendar: 메모 표시와 읽기 전용 메모 미리보기를 제공합니다.
- 메모는 Unicode code point 기준 1,000자로 제한됩니다.
- 완료 기록과 메모 metadata는 서로 독립된 lifecycle을 가집니다.

### 데이터 구조

- `habit_completions`: 변경하지 않는 완료 event와 날짜 데이터
- `habit_completion_notes`: 완료 기록별 선택적 mutable 1:1 메모 metadata
- 완료 기록을 삭제하면 연결된 메모도 cascade 삭제됩니다.
- 메모는 completion, streak, rate, stats semantics를 변경하지 않습니다.

### 보안

- own-user RLS와 composite ownership constraint로 메모 record를 보호합니다.
- 보관된 루틴에는 새 메모를 추가할 수 없습니다.
- 보관된 루틴의 기존 메모는 조회, 수정, 삭제할 수 있습니다.

### 화면별 역할

- Today: 오늘의 완료 기록을 남기고 메모를 작성합니다.
- Habit Detail: 완료 기록의 메모를 관리합니다.
- Calendar: 완료 기록과 읽기 전용 메모 미리보기를 탐색합니다.

## V2.1 루틴 순서 변경

- `/habits`의 활성 루틴 순서 변경
- `/dashboard` Today에서도 동일한 순서 사용
- `created_at`과 `id`를 stable tie-break로 사용하는 `habits.sort_order`
- 인증된 ownership validation을 포함한 atomic `reorder_habits(uuid[])` RPC
- 접근 가능한 위/아래 순서 변경 control
- 보관된 루틴은 기존 `sort_order`를 유지

### V2.1 보안

- RPC는 `auth.uid()`를 사용하고 정확한 활성 루틴 집합을 검증합니다.
- `sort_order` 직접 update는 차단되며 순서 변경은 RPC를 사용합니다.

## V2.2 완료 메모 UX 개선

- Habit Detail의 메모 있음 filter와 현재 history 기준 메모 수 요약
- 긴 메모를 쉽게 읽기 위한 펼치기/접기
- Calendar 선택 날짜의 완료/메모 요약과 명확한 미리보기 hierarchy
- Calendar 완료 기록에서 관련 Habit Detail로 이동하는 링크
- database schema 변경 없음; completion과 note lifecycle 유지

## V2.3 주간 / 월간 리뷰

- 현재 주간과 현재 월을 리뷰하는 `/review` route
- 완료 횟수, 완료한 날짜 수, 메모 수 요약
- 현재 사용 중인 루틴별 최소 기록 breakdown
- 보관된 루틴의 과거 기록도 유지하는 읽기 전용 메모 timeline
- 인증된 Review query의 completion pagination과 chunk-safe 메모 조회
- Review 기록에서 Habit Detail로 이동하는 링크
- Review는 completion이나 note를 변경하지 않으며 새 database schema가 필요하지 않습니다.

## V2.4 리뷰 기록 탐색

- URL 기반 `period`/`reference` 상태
- 이전/다음 주 및 월 navigation
- 현재 기간의 미래 navigation 차단
- URL과 ReviewData reconciliation 및 stale response 보호
- 전역 navigation의 `/review` 진입점

## 알려진 문제

현재 확인된 사용자 대상 알려진 문제는 없습니다.

`lib/demo-habits.ts`는 production import가 없는 maintenance backlog 파일입니다.

## 개발 환경

### 요구 사항

- Node.js
- Supabase project

### 환경 변수

`.env.local`에 다음 변수를 설정합니다. 실제 값이나 secret은 repository에 커밋하지 않습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 검증

```bash
npm run format
npm run format:check
npm run lint
npx tsc --noEmit
npm run build
```

## 유지보수 / 추후 작업

### 유지보수

- Today completion lookup 중복 가능성 검토
- Calendar completion query pagination 개선
- Habit Detail history pagination 및 장기 history 처리
- `getCompletionNoteFlags()` 유지 필요성 검토
- `lib/demo-habits.ts` production 미사용 파일 정리
- 인증된 브라우저 runtime smoke test

### 추후 작업

- Stats/Report 메모 분석
- 메모 검색 및 multiple notes
- mood/rating metadata
- 과거 완료 기록 backfill
- drag-and-drop 순서 변경
- Stats, Calendar, Habit Detail 순서 변경
- 보관된 루틴 순서 변경 UI
- 실시간 multi-tab 동기화
- 특정 completion deep link
- Review의 보관된 루틴 breakdown
- Review rate, streak 비교, chart, AI summary

## 현재 상태

현재 버전: **V2.4 — 리뷰 기록 탐색**

V2.4 구현과 정적 Final Audit을 완료했습니다. 실제 브라우저 및 모바일 runtime smoke test 후 release를 확정합니다.
