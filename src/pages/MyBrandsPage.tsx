import { PageContainer } from "@/components/layout/PageContainer";

export default function MyBrandsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Brands</h1>
        <p className="text-muted-foreground">
          Manage your favorite brands and products
        </p>
      </div>
    </PageContainer>
  );
}
