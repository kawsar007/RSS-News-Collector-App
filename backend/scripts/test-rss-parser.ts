import { RssParserService } from '../src/rss-parser/rss-parser.service';

async function main() {
  const service = new RssParserService();

  const feedUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
  const items = await service.fetchAndParse(feedUrl);

  console.log(`Fetched ${items.length} items.\n`);
  console.log('First 3 items:\n');
  console.log(JSON.stringify(items.slice(0, 3), null, 2));
}

main().catch((err) => {
  console.error('Error while testing RSS parser:', err);
  process.exit(1);
});
