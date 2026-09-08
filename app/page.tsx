import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-semibold">Routine</Link>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-6 px-5 py-20">
        <p className="text-sm font-medium text-muted-foreground">매일, 나를 위한 작은 습관</p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Routine</h1>
        <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">작은 실천을 모아 나다운 하루를 만드세요. 오늘의 습관을 확인하고 꾸준한 변화를 시작하세요.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/auth/sign-up">회원가입</Link></Button>
          <Button asChild variant="outline"><Link href="/auth/login">로그인</Link></Button>
        </div>
      </main>
      <footer className="border-t px-5 py-5 text-center text-sm text-muted-foreground">Routine · 하루의 작은 변화</footer>
    </div>
  );
}
