const puppeteer = require('puppeteer');
const fs = require('fs');
const cliProgress = require('cli-progress');
function waitForTimeout(page, timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

function extractNumbersFromString(str) {
    const regex = /\d+\.?\d*/g;
    const matches = str.match(regex);
    if (matches) {
        return matches.map(Number)[0];
    } else {
        return [];
    }
}

function average(numbers) {
    if (numbers.length === 0) return 0; // Avoid division by zero for an empty array

    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    return sum / numbers.length;
}

async function get_new_links(page) {
    return await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
            .filter(link => link.href.startsWith(window.location.origin + '/forum') && !link.href.includes('/forum?noteId'))
            .map(link => link.href);
    });
};

async function get_paper_urls(main_url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(main_url, { waitUntil: 'networkidle2', timeout: 0 });

    let allLinks = new Set();

    try {
        await page.waitForSelector('nav.pagination-container', { timeout: 5000 });
        const numberOfPages = await page.evaluate(() => {
            return document.querySelectorAll('ul.pagination li:not(.left-arrow, .right-arrow)').length;
        });

        console.log(`Number of pages found: ${numberOfPages}`);
        const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        progressBar.start(numberOfPages, 0);

        for (let i = 1; i <= numberOfPages; i++) {
            progressBar.increment();
            const selector = `ul.pagination li:nth-child(${i + 2}) a`;
            await page.click(selector);
            await waitForTimeout(page, 2000);
            newLinks = await get_new_links(page)
            newLinks.forEach(link => allLinks.add(link));
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }

    await browser.close();
    return Array.from(allLinks);
}

async function extract_stats(pages) {
    let metadata = {};
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log(`\nNumber of pages to process: ${pages.length}`);
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(pages.length, 0);
    for (const url of pages) {
        progressBar.increment();
        await page.goto(url, { waitUntil: 'networkidle2' });

        await waitForTimeout(page, 2000);

        const keywords = ['Preliminary Rating'];
        let intrim_data = {};

        const keyword = keywords[0];
        let matchIndex = 0;
        let startIndex = 0;
        let content = await page.content();
        let score = 0;
        let data = [];

        while ((startIndex = content.indexOf(keyword, startIndex)) !== -1) {
            if (matchIndex % 2 === 0) {
                startIndex += keyword.length;
                let htmlSnippet = content.substring(startIndex, startIndex + 100).split('\n')[0];

                const innerText = await page.evaluate(snippet => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = snippet;
                    return tempDiv.textContent || tempDiv.innerText || "";
                }, htmlSnippet);
                score = extractNumbersFromString(innerText);
                data.push(score);
            } else {
                startIndex += keyword.length;
            }
            startIndex++;
            matchIndex++;
        }
        intrim_data['preiminary_ratings'] = data;
        const avg = average(data);
        intrim_data['average_rating'] = avg.toFixed(2);
        metadata[url] = intrim_data;

        await waitForTimeout(page, 1000);
    }

    await browser.close();
    return metadata;
}

(async () => {
    const yargs = require('yargs/yargs');
    const { hideBin } = require('yargs/helpers');
    const argv = yargs(hideBin(process.argv)).argv;

    openreview_main_url = argv.openreview_main_url;
    venue_name = argv.venue_name;

    const pages = await get_paper_urls(openreview_main_url)
    const result = await extract_stats(pages);

    json_file_name = venue_name + '_ratings.json';
    fs.writeFileSync(json_file_name, JSON.stringify(result, null, 2));
    console.log('\nResults saved in JSON file');

    let scores = [];
    for (const key in result) {
        scores.push(Number(result[key]['average_rating']));
    }

    const avg = average(scores);
    console.log(`Average rating of all papers: ${avg.toFixed(2)}`);
    process.exit();
})();
