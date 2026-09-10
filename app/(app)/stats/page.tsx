import { StatsView } from "@/components/stats-view";
import { PageHeader } from "@/components/page-header";
export default function StatsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Stats" description="루틴 진행 상황을 한눈에 확인하세요." />
      <StatsView />
    </div>
  );
}
