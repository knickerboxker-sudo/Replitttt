import { PageContainer } from "@/components/layout/PageContainer";

export default function SearchPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Search for recalls and safety information
        </p>
      </div>
    </PageContainer>
  );
}
