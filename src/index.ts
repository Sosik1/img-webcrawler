import * as fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as urlParser from "url";

const seenUrls = {};

const getUrl = (link) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `http://localhost:3000${link}`;
  } else return `http://localhost:3000/${link}`;
};

fetch("http://localhost:3000")
  .then((response) => {
    response.text();
  })
  .then((html) => console.log("html", html));

const crawl = async ({ url }) => {
  if (seenUrls[url]) return;
  console.log("Crawling ", url);
  seenUrls[url] = true;

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();

  const imageUrls = $("img")
    .map((i, link) => link.attribs.src)
    .get();

  imageUrls.forEach((imageUrl) => {
    fetch(getUrl(imageUrl)).then((response) => {
      const filename = path.basename(imageUrl);
      const dest = fs.createWriteStream(`images/${filename}`);
      response.body.pipe(dest);
    });
  });

  const { host } = urlParser.parse(url);

  links
    .filter((link) => link.includes(host))
    .forEach((link) => {
      crawl({ url: getUrl(link) });
    });
};

crawl({
  url: "http://stevescooking.blogspot.com/",
});
