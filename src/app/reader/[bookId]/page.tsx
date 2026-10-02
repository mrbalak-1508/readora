import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ bookId: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export default async function ReaderLegacyRedirect({ params, searchParams }: PageProps) {
  const { bookId } = await params;
  const sp = searchParams ? await searchParams : {};
  const query = sp.page ? `?page=${sp.page}` : "";
  redirect(`/read/${bookId}${query}`);
}
