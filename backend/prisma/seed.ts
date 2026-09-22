import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.newsSource.findUnique({
    where: { url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  });

  if (existing) {
    console.log('Sample source already exists, skipping.');
    return;
  }

  const source = await prisma.newsSource.create({
    data: {
      name: 'BBC News',
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
      type: 'rss',
      isActive: true,
    },
  });

  console.log('Seeded source:', source);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
