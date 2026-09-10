import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">이메일을 확인해주세요.</CardTitle>
            <CardDescription>회원가입 확인 링크를 이메일로 보냈습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이메일의 확인 링크를 눌러 계정을 활성화한 뒤 로그인해주세요.
            </p>
            <Button asChild className="mt-4 w-full min-h-11">
              <Link href="/auth/login">로그인으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
