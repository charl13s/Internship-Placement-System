import { prisma } from '../lib/db'

// --- DUMMY DATA POOLS ---
const companies = [
    "Acme Corp", "Global Dynamics", "TechFlow", "Nairobi Systems", "FinServe Kenya",
    "CloudSync", "AfriInnovate", "NextGen Solutions", "BlueSky Media", "Quantum Finance",
    "Apex Health", "Titan AI", "CyberShield", "DevCraft", "DataMinds",
    "EcoTech", "Urban Logistics", "Stellar Space", "Nexus Banking", "Pioneer Retail"
]

const locations = ["Nairobi, Kenya", "Remote", "London, UK", "New York, NY", "Hybrid", "San Francisco, CA"]

const jobTitles = [
    "Software Engineering Intern", "Frontend Developer Intern", "Backend Developer Intern",
    "Data Science Intern", "Product Management Intern", "Cybersecurity Analyst Intern",
    "UX/UI Design Intern", "Cloud Architecture Intern", "Mobile App (Android) Intern",
    "Machine Learning Intern", "Marketing Analytics Intern", "DevOps Engineering Intern",
    "Financial Analyst Intern", "Blockchain Developer Intern", "QA Testing Intern"
]

const skillsPool = [
    "React", "TypeScript", "Node.js", "Python", "Java", "C++", "AWS", "Docker",
    "Figma", "UI/UX", "Data Analysis", "SQL", "Machine Learning", "Go", "Rust",
    "Kotlin", "Swift", "Cybersecurity", "Agile", "Excel", "Financial Modeling"
]

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "Kevin", "Brian", "Ian", "Mercy", "Faith", "Samuel", "Grace", "Daniel", "Sarah", "Alex"]
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Mwangi", "Otieno", "Mutua", "Wanjiku", "Kimani", "Ochieng", "Njoroge", "Achieng", "Kamau"]
const courses = ["Computer Science", "Informatics", "Business Administration", "Data Science", "Software Engineering", "Information Technology", "Mathematics"]

// Helper to get random items
const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
const getRandomMultiple = (arr: any[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

async function main() {
    console.log("🧹 Sweeping the database clean...")
    // Delete in reverse order to avoid foreign key constraint errors
    await prisma.application.deleteMany()
    await prisma.listing.deleteMany()
    await prisma.intern.deleteMany()
    await prisma.organization.deleteMany()

    console.log("🏢 Creating 20 Organizations...")
    const orgIds: string[] = []
    for (let i = 0; i < 20; i++) {
        const org = await prisma.organization.create({
            data: {
                clerkId: `fake_org_${i}_${Date.now()}`,
                name: companies[i],
                email: `hr@${companies[i].replace(/\s+/g, '').toLowerCase()}.com`,
                website: `https://${companies[i].replace(/\s+/g, '').toLowerCase()}.com`,
                location: getRandom(locations),
                description: `We are ${companies[i]}, a leading company looking for bright minds to join our internship program. We value innovation, hard work, and continuous learning.`,
                isVerified: Math.random() > 0.2, // 80% chance of being verified
            }
        })
        orgIds.push(org.id)
    }

    console.log("💼 Creating 80 Job Listings...")
    const listingIds: string[] = []
    for (let i = 0; i < 80; i++) {
        // Generate a future closing date between 5 and 60 days from now
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 55) + 5)

        const listing = await prisma.listing.create({
            data: {
                title: getRandom(jobTitles),
                requiredSkills: getRandomMultiple(skillsPool, Math.floor(Math.random() * 3) + 3), // 3 to 5 skills
                closingDate: futureDate,
                status: "OPEN",
                organizationId: getRandom(orgIds)
            }
        })
        listingIds.push(listing.id)
    }

    console.log("🎓 Creating 50 Student Interns...")
    const internIds: string[] = []
    for (let i = 0; i < 50; i++) {
        const fName = getRandom(firstNames)
        const lName = getRandom(lastNames)
        const intern = await prisma.intern.create({
            data: {
                clerkId: `fake_student_${i}_${Date.now()}`,
                firstName: fName,
                lastName: lName,
                email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@student.university.edu`,
                course: getRandom(courses),
                keySkills: getRandomMultiple(skillsPool, Math.floor(Math.random() * 4) + 2), // 2 to 5 skills
            }
        })
        internIds.push(intern.id)
    }

    console.log("📝 Generating Applications...")
    let applicationCount = 0
    for (const internId of internIds) {
        // Each intern applies to 3-6 random jobs
        const jobsToApply = getRandomMultiple(listingIds, Math.floor(Math.random() * 4) + 3)

        for (const listingId of jobsToApply) {
            // Randomly assign statuses (mostly pending, some rejected/accepted)
            const rand = Math.random()
            const status = rand > 0.85 ? "Accepted" : rand > 0.7 ? "Rejected" : "Pending"

            await prisma.application.create({
                data: {
                    internId: internId,
                    listingId: listingId,
                    status: status
                }
            })
            applicationCount++
        }
    }

    console.log(`✅ Seed complete! Generated ${applicationCount} applications across 80 jobs.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })