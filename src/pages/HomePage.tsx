import { PageContainer } from "@/components/layout/PageContainer";

export default function HomePage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Sortir</h1>
        <p className="text-muted-foreground">
          Scan groceries and products to check for FDA food recalls
        </p>
      </div>
    </PageContainer>
  );
}
