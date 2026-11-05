import { notFound, permanentRedirect } from "next/navigation";
import { archiveProjects } from "@/lib/projects";

export function generateStaticParams() {
  return archiveProjects.map((project) => ({ slug: project.slug }));
}

export default async function LegacyProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!archiveProjects.some((project) => project.slug === slug)) notFound();
  permanentRedirect(`/proiecte/${slug}`);
}
