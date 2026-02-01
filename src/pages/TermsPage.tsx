import { PageContainer } from "@/components/layout/PageContainer";

export default function TermsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <div className="prose dark:prose-invert">
          <p>Terms of service content goes here.</p>
        </div>
      </div>
    </PageContainer>
  );
}
