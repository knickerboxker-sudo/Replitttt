import { PageContainer } from "@/components/layout/PageContainer";

export default function PrivacyPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <div className="prose dark:prose-invert">
          <p>Privacy policy content goes here.</p>
        </div>
      </div>
    </PageContainer>
  );
}
