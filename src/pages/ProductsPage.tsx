import { PageContainer } from "@/components/layout/PageContainer";

export default function ProductsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Products</h1>
        <p className="text-muted-foreground">
          Track consumer products and check for CPSC recalls
        </p>
      </div>
    </PageContainer>
  );
}
