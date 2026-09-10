import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return params.error ? (
    <p className="text-sm text-muted-foreground">
      인증을 완료하지 못했어요. 링크를 다시 확인해주세요.
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">인증 중 문제가 발생했어요. 다시 로그인해주세요.</p>
  );
}
export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">인증을 완료하지 못했어요.</CardTitle>
          <CardDescription>인증 링크를 확인하거나 다시 로그인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">확인 중...</p>}>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
          <Button asChild className="mt-6 w-full min-h-11">
            <Link href="/auth/login">로그인으로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
