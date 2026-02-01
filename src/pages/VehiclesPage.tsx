import { PageContainer } from "@/components/layout/PageContainer";

export default function VehiclesPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Vehicles</h1>
        <p className="text-muted-foreground">
          Track your vehicles and check for NHTSA recalls
        </p>
      </div>
    </PageContainer>
  );
}
