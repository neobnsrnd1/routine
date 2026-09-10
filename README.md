# Routine

반복되는 일상 루틴을 만들고, 오늘의 실행과 완료 기록을 관리하는 habit tracking application입니다.

## Overview

Routine은 이메일 기반 인증 후 루틴을 생성하고 일정에 따라 오늘 할 일을 확인할 수 있습니다. 완료 기록, 연속 달성(streak), 월별 기록과 통계를 통해 꾸준한 실행 흐름을 확인할 수 있습니다.

## Features

- 이메일/비밀번호 회원가입, 로그인, 비밀번호 재설정
- 루틴 생성, 수정, 보관
- `Daily`, `Specific Days`, `Weekly Target` 일정 설정
- 오늘 루틴 확인 및 완료/완료 취소
- 루틴별 streak와 최근 완료 기록
- 월별 완료 기록 캘린더
- 최근 활동과 루틴별 통계
- 반응형 모바일/데스크톱 UI
- Light/Dark/System 테마

## Schedule Types

- `Daily`: 매일 수행하는 루틴
- `Specific Days`: 선택한 요일에 수행하는 루틴
- `Weekly Target`: 한 주 동안 달성할 목표 횟수를 기준으로 관리하는 루틴

Weekly Target은 특정 날짜를 자동으로 미완료로 해석하는 방식이 아니라 주간 목표 개념으로 사용됩니다.

## Tech Stack

- Next.js 16.3.4 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 기반 UI components
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Lucide React
- ESLint 9
- Prettier

## Routes

### Public

| Route | Description              |
| ----- | ------------------------ |
| `/`   | 서비스 소개 및 진입 화면 |

### Auth

| Route                   | Description                |
| ----------------------- | -------------------------- |
| `/auth/login`           | 로그인                     |
| `/auth/sign-up`         | 회원가입                   |
| `/auth/forgot-password` | 비밀번호 재설정 링크 요청  |
| `/auth/update-password` | 새 비밀번호 설정           |
| `/auth/sign-up-success` | 회원가입 확인 안내         |
| `/auth/error`           | 인증 오류 안내             |
| `/auth/confirm`         | 이메일 인증 callback route |

### Authenticated

| Route          | Description            |
| -------------- | ---------------------- |
| `/dashboard`   | 오늘의 루틴            |
| `/habits`      | 루틴 생성 및 관리      |
| `/habits/[id]` | 루틴 상세 및 완료 기록 |
| `/calendar`    | 월별 완료 기록         |
| `/stats`       | 루틴 통계              |

## Project Structure

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

## Version History

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

## Known Issues

현재 확인된 user-facing Known Issue는 없습니다.

`lib/demo-habits.ts`는 production import가 없는 maintenance backlog 파일입니다.

## Development

### Requirements

- Node.js
- Supabase project

### Environment Variables

`.env.local`에 다음 변수를 설정합니다. 실제 값이나 secret은 repository에 커밋하지 않습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Install and Run

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### Validation

```bash
npm run format
npm run format:check
npm run lint
npx tsc --noEmit
npm run build
```

## Status

현재 버전: **V1.3**

V1.3 Known Issue Cleanup 및 Runtime & Accessibility Audit를 완료했습니다.
