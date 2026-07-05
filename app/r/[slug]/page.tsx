export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{slug}</h1>
      <p className="text-muted-foreground">Menu items will load here.</p>
    </main>
  );
}
