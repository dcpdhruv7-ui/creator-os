import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-5">
        <p className="text-sm font-medium text-emerald-300">Day 1 foundation</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">{title}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">This section is ready for a future MVP layer.</p>
        </CardContent>
      </Card>
    </section>
  );
}
