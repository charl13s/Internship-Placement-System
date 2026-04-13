import "dotenv/config";

export default {
    schema: "prisma/schema.prisma",
    datasource: {
        // We use the direct URL here so `npx prisma db push` works instantly
        url: process.env.DIRECT_URL,
    },
};