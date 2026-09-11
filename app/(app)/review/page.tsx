import { PageHeader } from "@/components/page-header";
import { ReviewView } from "@/components/review-view";

export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Review" description="최근 기록을 돌아보세요." />
      <ReviewView />
    </div>
  );
}
