const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const options = {
    headers: {
        'User-Agent': getRandomUserAgent(),
        'Timeout': 3000
    }
};

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeGoogle(query) {
    try {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        const encodedQuery = encodeURIComponent(query);

        const response = await axios.get(`https://www.google.com/search?q=${encodedQuery}`, options);
        const html = response.data;
        const $ = cheerio.load(html);
        
        const firstResult = $('.g').first();
        
        if (!firstResult.length) {
            throw new Error('No results found');
        }

        const item = {
            title: firstResult.find('h3').text() || 'No title found',
            link: firstResult.find('a').attr('href') || 'No link found'
        };
        
        return item;

    } catch (error) {
        return error.message;
    }
}


async function getPagePreview(url) {
    try {
        const response = await axios.get(url, options);
        
        const $ = cheerio.load(response.data);
        
        return {
            title: $('meta[property="og:title"]').attr('content') || $('title').text(),
            description: $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content'),
            image: $('meta[property="og:image"]').attr('content') ||
                   $('img').first().attr('src'),
            type: $('meta[property="og:type"]').attr('content'),
            keywords: $('meta[name="keywords"]').attr('content')
        };
    } catch (error) {
        return error.message
    }
}

async function scrapeProductDetails(url) {
    try {
        const response = await axios.get(url, options);
        const html = response.data;
        const $ = cheerio.load(html);

        const details = {
            title: $('h1').first().text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   'Title not found',
            
            ingredients: $('[itemprop="ingredients"]').text().trim() ||
                        $('*:contains("Ingredients")').next().text().trim() ||
                        'Ingredients not found',
            
            nutritionalInfo: $('[itemprop="nutrition"]').text().trim() ||
                           $('*:contains("Nutritional")').next().text().trim() ||
                           'Nutritional info not found',
            
            brand: $('[itemprop="brand"]').text().trim() ||
                  $('meta[property="og:brand"]').attr('content') ||
                  'Brand not found',
            
            countryOfOrigin: $('*:contains("Country of Origin")').next().text().trim() ||
                            'Country of origin not found'
        };

        // Clean up the data
        Object.keys(details).forEach(key => {
            if (details[key] === '') {
                details[key] = `${key} not found`;
            }
        });

        return details;

    } catch (error) {
        return {
            error: true,
            message: error.message
        };
    }
}



async function main() {
    const searchResult = await scrapeGoogle('8904320015398');
    console.log(searchResult)
    if (searchResult.link) {
        const productPage = await getPagePreview(searchResult.link);
        const productDetails = await scrapeProductDetails(searchResult.link);
        console.log(productPage, productDetails);
    }
}

main();