import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Initialize the PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });

// --- DATA DICTIONARIES FOR GENERATION ---
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
const lastNames = ["Kamau", "Wanjiku", "Ochieng", "Kiprono", "Mutua", "Njeri", "Odhiambo", "Akinyi", "Maina", "Mwangi", "Njoroge", "Muthoni", "Kariuki", "Nyongesa", "Oluoch"]
const courses = ["Computer Science", "Software Engineering", "Informatics and Computer Science", "Data Science", "Cybersecurity", "Information Technology", "Business Information Systems"]
const techSkills = ["React", "Node.js", "Python", "Java", "Kotlin", "Firebase", "AWS", "Docker", "PostgreSQL", "MongoDB", "TypeScript", "Tailwind CSS", "Figma", "Git", "C++", "C#", ".NET", "Vue.js", "Angular", "GraphQL", "Redis", "Linux"]
const companyNames = ["Safaricom", "Equity Group", "Cellulant", "Andela", "Microsoft ADC", "Google Africa", "Twiga Foods", "Sendy", "Little App", "Pesapal"]
const jobTitles = ["Frontend Engineer Intern", "Backend Developer Intern", "Fullstack Intern", "Data Science Intern", "Cloud DevOps Intern", "Mobile App Intern (Android)", "UI/UX Design Intern", "Security Analyst Intern"]

// Helper: Get random items from an array
function getRandomItems(arr: string[], count: number) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

// Helper: Get a random element from an array
function getRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
    console.log('🧹 Wiping existing database...')
    await prisma.application.deleteMany()
    await prisma.listing.deleteMany()
    await prisma.intern.deleteMany()
    await prisma.organization.deleteMany()

    // ---------------------------------------------------------
    // 1. CREATE ORGANIZATIONS
    // ---------------------------------------------------------
    console.log('🏢 Generating Organizations...')
    const organizations = []

    // Create YOUR specific organization first so you can log in easily
    const myOrg = await prisma.organization.create({
        data: {
            clerkId: 'YOUR_CLERK_ID_HERE', // <--- REPLACE THIS LATER
            email: 'hr@mycompany.com',
            name: 'Elevate Tech (My Company)',
            website: 'https://elevatetech.com',
            location: 'Nairobi, Kenya',
            description: 'This is my primary testing organization.',
            isVerified: true,
        }
    })
    organizations.push(myOrg)

    // Generate 9 more random organizations
    for (let i = 0; i < 9; i++) {
        const org = await prisma.organization.create({
            data: {
                clerkId: `org_random_${i}`,
                email: `hr@${companyNames[i].toLowerCase().replace(/\s/g, '')}.com`,
                name: companyNames[i],
                location: 'Nairobi, Kenya',
                isVerified: true,
            }
        })
        organizations.push(org)
    }

    // ---------------------------------------------------------
    // 2. CREATE JOB LISTINGS
    // ---------------------------------------------------------
    console.log('💼 Generating Job Listings...')
    const listings = []
    for (const org of organizations) {
        // Each organization gets 3 random job listings
        for (let i = 0; i < 3; i++) {
            const required = getRandomItems(techSkills, Math.floor(Math.random() * 3) + 3) // 3 to 5 skills
            const listing = await prisma.listing.create({
                data: {
                    title: getRandom(jobTitles),
                    requiredSkills: required,
                    status: 'OPEN',
                    organizationId: org.id,
                    closingDate: new Date('2026-12-31'),
                }
            })
            listings.push(listing)
        }
    }

    // ---------------------------------------------------------
    // 3. CREATE INTERNS
    // ---------------------------------------------------------
    console.log('🎓 Generating 150 Students...')
    const interns = []
    for (let i = 0; i < 150; i++) {
        const skills = getRandomItems(techSkills, Math.floor(Math.random() * 5) + 3) // 3 to 7 skills
        const intern = await prisma.intern.create({
            data: {
                clerkId: `intern_user_${i}`,
                email: `student${i}@university.edu`,
                firstName: getRandom(firstNames),
                lastName: getRandom(lastNames),
                course: getRandom(courses),
                keySkills: skills,
                cvUrl: 'https://fake-url.com/cv.pdf',
            }
        })
        interns.push(intern)
    }

    // ---------------------------------------------------------
    // 4. CREATE APPLICATIONS (The Simulation)
    // ---------------------------------------------------------
    console.log('🚀 Simulating hundreds of Job Applications...')

    let totalApplications = 0;

    for (const listing of listings) {
        // Pick 15 to 30 random students to apply to this specific job
        const applicants = getRandomItems(interns.map(i => i.id), Math.floor(Math.random() * 15) + 15)

        for (const internId of applicants) {
            // Find the intern to calculate their exact fake AI score
            const intern = interns.find(i => i.id === internId)!

            // SIMULATE THE AI CALCULATION
            const jobUpper = listing.requiredSkills.map(s => s.toUpperCase())
            const studentUpper = intern.keySkills.map(s => s.toUpperCase())

            let matches = 0
            const extracted: string[] = []

            // Determine match score exactly how the Python server does it
            for (const req of jobUpper) {
                if (studentUpper.includes(req)) {
                    matches++
                    // We add the properly capitalized original string to the extracted array
                    extracted.push(listing.requiredSkills[jobUpper.indexOf(req)])
                }
            }
            // Throw in a random extra skill they have just to make the UI look realistic
            extracted.push(intern.keySkills[0])

            const matchScore = Math.round((matches / listing.requiredSkills.length) * 100)

            // Randomize status slightly (mostly Pending, some Accepted/Rejected)
            const statusRoll = Math.random()
            let status = 'Pending'
            if (statusRoll > 0.85) status = 'Accepted'
            else if (statusRoll > 0.70) status = 'Rejected'

            await prisma.application.create({
                data: {
                    listingId: listing.id,
                    internId: intern.id,
                    status: status,
                    matchScore: matchScore,
                    extractedSkills: [...new Set(extracted)], // Ensure no duplicates
                }
            })
            totalApplications++
        }
    }

    console.log(`✅ SUCCESS! Generated ${organizations.length} Orgs, ${listings.length} Jobs, ${interns.length} Students, and ${totalApplications} AI-Scored Applications.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })