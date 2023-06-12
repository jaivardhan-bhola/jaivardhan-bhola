const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');

const extractLinks = async () => {
    const response = await axios.get('https://github.com/pulls?q=is%3Apr+is%3Amerged+author%3Ajaivardhan-bhola');
    const $ = cheerio.load(response.data);
    const links = $('a[data-hovercard-type="repository"]').map((i, link) => $(link).attr('href')).get();
    return links;
};

const checkLinks = async (links) => {
    const promises = links.map(async (link) => {
        try {
            await axios.get(`https://github.com${link}`);
            return true;
        } catch (error) {
            return false;
        }
    });
    const results = await Promise.all(promises);
    return results.every((result) => result === true);
};

const generateContributionList = async () => {
    const links = await extractLinks();
    const linksAreValid = await checkLinks(links);
    if (!linksAreValid) {
        throw new Error('Some links are invalid');
    }
    const contributionList = links.map((link) => `- [${path.basename(link)}](${link})`).join('\n');
    return contributionList;
};

const main = async () => {
    const contributionList = await generateContributionList();
    const readmePath = `${process.env.GITHUB_WORKSPACE}/README.md`;
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    readmeContent = readmeContent.replace(/<!-- CONTRIBUTION-LIST:START -->(.|\n)*<!-- CONTRIBUTION-LIST:END -->/, `<!-- CONTRIBUTION-LIST:START -->\n${contributionList}\n<!-- CONTRIBUTION-LIST:END -->`);
    fs.writeFileSync(readmePath, readmeContent);
};
main();