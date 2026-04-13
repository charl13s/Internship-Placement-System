import { currentUser } from "@clerk/nextjs/server"
import { UserButton, Show, SignInButton } from "@clerk/nextjs"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Building2, Calendar, MapPin, Search, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react"

// Shadcn UI
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const dynamic = "force-dynamic"

export default async function StudentDiscoveryFeed({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await currentUser()

  // 1. Await params and extract Search & Pagination values
  const resolvedParams = await searchParams
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : ""

  // Parse the page number (default to 1 if it doesn't exist)
  const currentPage = parseInt(typeof resolvedParams.page === 'string' ? resolvedParams.page : '1', 10) || 1
  const ITEMS_PER_PAGE = 6 // Show 6 jobs per page

  // THE AUTO-SWEEP
  await prisma.listing.updateMany({
    where: {
      status: "OPEN",
      closingDate: { lt: new Date() }
    },
    data: { status: "CLOSED" }
  })

  // 2. Build the exact filter criteria so we can use it for both Data and Counting
  const whereClause = {
    status: "OPEN",
    deletedAt: null,
    ...(query ? {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { organization: { name: { contains: query, mode: "insensitive" as const } } }
      ]
    } : {})
  }

  // 3. FETCH JOBS & TOTAL COUNT IN PARALLEL
  const [jobs, totalJobs] = await Promise.all([
    prisma.listing.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { organization: true },
      skip: (currentPage - 1) * ITEMS_PER_PAGE, // Skip the jobs from previous pages
      take: ITEMS_PER_PAGE,                     // Take exactly 6 jobs
    }),
    prisma.listing.count({ where: whereClause }) // Count how many total jobs match the filter
  ])

  // Calculate total pages needed
  const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE)

  // Helper function to build pagination URLs without losing the search query
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (pageNumber > 1) params.set("page", pageNumber.toString())
    return `/?${params.toString()}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">

      {/* HERO SECTION & SEARCH */}
      <div className="bg-neutral-900 flex flex-col items-center border-b border-neutral-800">

        <header className="w-full px-6 py-5 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <div className="bg-white text-neutral-900 p-1.5 rounded-md">
              <Building2 className="w-5 h-5" />
            </div>
            InternSystem
          </div>

          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <Link href="/my-applications" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                My Applications
              </Link>
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="outline" className="bg-transparent text-white border-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors">
                  Log In
                </Button>
              </SignInButton>
            </Show>
          </div>
        </header>

        <div className="px-6 py-16 text-center flex flex-col items-center w-full">
          <Badge variant="outline" className="text-neutral-400 border-neutral-700 mb-6 bg-neutral-800/50 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-2 text-amber-400" />
            {totalJobs} {query ? "Matching" : "Active"} Internships Available
          </Badge>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 max-w-2xl">
            Launch your career with the top companies in tech.
          </h1>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl">
            Find and apply to verified internships tailored perfectly to your university course and skill set.
          </p>

          {/* THE SEARCH FORM */}
          <form action="/" method="GET" className="w-full max-w-2xl flex items-center gap-2 bg-white p-2 rounded-xl shadow-lg focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <div className="flex items-center px-3 text-neutral-400">
              <Search className="w-5 h-5" />
            </div>
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search for roles or companies..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 text-base"
            />
            {query && (
              <Button asChild variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 rounded-full w-8 h-8 mr-1">
                <Link href="/">
                  <X className="w-4 h-4" />
                </Link>
              </Button>
            )}
            <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-8">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* DISCOVERY GRID */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            {query ? `Search results for "${query}"` : "Recommended for you"}
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 border-dashed">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900">No matching internships found</h3>
            <p className="text-neutral-500 mb-4">Try adjusting your search terms or clearing the filter.</p>
            {query && (
              <Button asChild variant="outline">
                <Link href="/">Clear Search</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {jobs.map((job) => (
                <Card key={job.id} className="flex flex-col hover:shadow-lg transition-all duration-300 hover:border-neutral-300 group cursor-pointer bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                        <span className="font-bold text-neutral-600 text-lg">
                          {job.organization.name.substring(0, 1)}
                        </span>
                      </div>
                      {job.createdAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none">New</Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-neutral-900 leading-tight mb-1 group-hover:text-neutral-700 transition-colors">
                        {job.title}
                      </CardTitle>
                      <p className="text-sm font-medium text-neutral-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {job.organization.name}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-6">
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {job.requiredSkills.slice(0, 4).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-neutral-100/80 text-neutral-600 font-medium hover:bg-neutral-200">
                          {skill}
                        </Badge>
                      ))}
                      {job.requiredSkills.length > 4 && (
                        <Badge variant="outline" className="text-neutral-400 font-medium hover:bg-transparent">
                          +{job.requiredSkills.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-500 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>Remote / Hybrid</span>
                      </div>
                      {job.closingDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span>Due {formatDate(job.closingDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button asChild className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold">
                      <Link href={`/jobs/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* 🚨 PAGINATION CONTROLS 🚨 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-neutral-200 pt-8">
                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Link href={createPageUrl(currentPage - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                  </Link>
                </Button>

                <div className="flex items-center gap-2 px-4 text-sm font-medium text-neutral-500">
                  Page <span className="text-neutral-900">{currentPage}</span> of <span className="text-neutral-900">{totalPages}</span>
                </div>

                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                >
                  <Link href={createPageUrl(currentPage + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}