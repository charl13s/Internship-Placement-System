import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// --- HELPER DATA ARRAYS ---
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Nancy", "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle"]
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]
const courses = ["B.Sc. Computer Science", "B.Sc. Information Technology", "B.Sc. Software Engineering", "B.A. Graphic Design", "B.Sc. Data Science", "B.B.A. Finance", "B.Sc. Cyber Security", "B.Sc. Business Information Systems"]
const skillsPool = ["React", "Node.js", "Python", "Java", "C++", "Figma", "UI/UX", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "TypeScript", "Next.js", "Tailwind CSS", "Machine Learning", "Data Analysis", "Pandas", "Cybersecurity", "Network Routing"]
const companyPrefixes = ["Apex", "Quantum", "Nexus", "Starlight", "Horizon", "Pinnacle", "Vanguard", "Zeith", "Aether", "Lumina", "Nova", "Pulse", "Vertex", "Echo", "Flux"]
const companySuffixes = ["Technologies", "Solutions", "Systems", "Studios", "Labs", "Digital", "Innovations", "Group", "Networks", "Software"]
const jobTitles = ["Frontend Intern", "Backend Intern", "Fullstack Intern", "UI/UX Design Intern", "Data Analyst Intern", "Product Management Intern", "DevOps Intern", "Cybersecurity Intern", "QA Testing Intern", "Cloud Architecture Intern"]

// --- HELPER FUNCTIONS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)
const randomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
const randomSubset = (arr: any[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

async function main() {
    console.log("🧹 Sweeping old database records...")

    // 1. Wipe existing data (Respecting foreign keys)
    await prisma.application.deleteMany()
    await prisma.listing.deleteMany()
    // 🚨 FIXED: Only delete dummy orgs and interns
    await prisma.organization.deleteMany({ where: { email: { endsWith: '@org.dummy.com' } } })
    await prisma.intern.deleteMany({ where: { email: { endsWith: '@intern.dummy.com' } } })

    console.log("🏭 Generating 50 Organizations...")
    const orgData = Array.from({ length: 50 }).map((_, i) => ({
        clerkId: `org_dummy_${i}_${Date.now()}`,
        // 🚨 FIXED: Ensuring email domain is exactly @org.dummy.com
        email: `contact${i}_${randomItem(companyPrefixes).toLowerCase()}@org.dummy.com`,
        name: `${randomItem(companyPrefixes)} ${randomItem(companySuffixes)}`,
        location: randomItem(["Remote", "Nairobi, Kenya", "Hybrid", "London, UK", "New York, USA"]),
        website: `https://www.example${i}.com`,
        description: "A leading innovator in the technology sector looking for bright minds to join our internship program.",
        isVerified: Math.random() > 0.2
    }))
    await prisma.organization.createMany({ data: orgData })
    // 🚨 FIXED: Looking for the exact domain we just created
    const createdOrgs = await prisma.organization.findMany({ where: { email: { endsWith: '@org.dummy.com' } } })

    console.log("📝 Generating 150 Job Listings...")
    const listingData = Array.from({ length: 150 }).map(() => {
        const isClosed = Math.random() > 0.8 // 20% of jobs are closed
        return {
            title: randomItem(jobTitles),
            requiredSkills: randomSubset(skillsPool, randomInt(3, 6)),
            status: isClosed ? "CLOSED" : "OPEN",
            closingDate: isClosed
                ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
                : randomDate(new Date(), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
            organizationId: randomItem(createdOrgs).id
        }
    })
    await prisma.listing.createMany({ data: listingData })
    const createdListings = await prisma.listing.findMany()

    console.log("🎓 Generating 300 Interns...")
    const internData = Array.from({ length: 300 }).map((_, i) => {
        const first = randomItem(firstNames)
        const last = randomItem(lastNames)
        return {
            clerkId: `intern_dummy_${i}_${Date.now()}`,
            email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@intern.dummy.com`,
            firstName: first,
            lastName: last,
            phone: `+254 7${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
            course: randomItem(courses),
            keySkills: randomSubset(skillsPool, randomInt(3, 7)),
            cvUrl: "https://example.com/dummy-cv.pdf"
        }
    })

    await prisma.intern.createMany({ data: internData.slice(0, 150) })
    await prisma.intern.createMany({ data: internData.slice(150, 300) })
    const createdInterns = await prisma.intern.findMany({ where: { email: { endsWith: '@intern.dummy.com' } } })

    console.log("🚀 Simulating ~1,000 Job Applications...")
    const applicationData: { internId: string, listingId: string, status: string }[] = []
    const statuses = ["Pending", "Pending", "Pending", "Accepted", "Rejected"]

    for (const intern of createdInterns) {
        const jobsToApplyTo = randomSubset(createdListings, randomInt(2, 5))
        for (const job of jobsToApplyTo) {
            applicationData.push({
                internId: intern.id,
                listingId: job.id,
                status: randomItem(statuses)
            })
        }
    }

    const chunkSize = 500;
    for (let i = 0; i < applicationData.length; i += chunkSize) {
        const chunk = applicationData.slice(i, i + chunkSize);
        await prisma.application.createMany({ data: chunk })
    }

    console.log(`✅ DONE! Successfully seeded:`)
    console.log(`   🏢 ${createdOrgs.length} Organizations`)
    console.log(`   📋 ${createdListings.length} Listings`)
    console.log(`   🎓 ${createdInterns.length} Interns`)
    console.log(`   📨 ${applicationData.length} Applications`)
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:")
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })