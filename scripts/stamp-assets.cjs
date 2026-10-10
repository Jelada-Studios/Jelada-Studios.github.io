/* Adds ?v=<hash of the file> to the local CSS and JS links in the pages.
   GitHub Pages lets browsers keep a file for 10 minutes, so a visitor could get a new page with
   old CSS. With the hash in the address, a changed file is always fetched fresh and an unchanged
   one stays cached. Run it after changing any CSS or JS: npm run stamp */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'fts-geology/index.html'];
const link = /((?:href|src)=")(\/?assets\/(?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")/g;

for (const page of pages) {
    const file = path.join(root, page);
    const html = fs.readFileSync(file, 'utf8');
    const out = html.replace(link, (m, pre, href, post) => {
        const hash = crypto.createHash('md5').update(fs.readFileSync(path.join(root, href.replace(/^\//, '')))).digest('hex').slice(0, 8);
        return `${pre}${href}?v=${hash}${post}`;
    });
    if (out !== html) fs.writeFileSync(file, out);
    console.log(page, out === html ? 'already current' : 'stamped');
}
