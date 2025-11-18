import { redirect } from "next/navigation"

interface SearchPageProps {
  searchParams: Promise<{
    term?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const term = params.term

  if (!term || term.trim() === "") {
    redirect("/")
  }

  // Redirect to the path-based route
  redirect(`/search/${encodeURIComponent(term.trim())}`)
}

