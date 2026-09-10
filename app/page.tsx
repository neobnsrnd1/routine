import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight sm:text-xl">
            Routine
          </Link>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-xl space-y-5">
          <p className="text-sm font-medium text-muted-foreground">매일, 나를 위한 작은 습관</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            매일 반복하는 일을
            <br />
            가볍게 기록하세요.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            오늘 할 루틴을 확인하고 꾸준함을 기록할 수 있습니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-11">
              <Link href="/auth/sign-up">시작하기</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/auth/login">로그인</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="border-t px-4 py-5 text-center text-sm text-muted-foreground">
        Routine · 하루의 작은 변화
      </footer>
    </div>
  );
}
