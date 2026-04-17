import fs from 'fs';
const html = fs.readFileSync('weeb_full_search.html', 'utf8');

const regex = /hx-get="([^"]+)"/g;
let match;
const tags = [];
while ((match = regex.exec(html)) !== null) {
  tags.push(match[1]);
}
console.log("HTMX endpoints:", tags);

const actionRegex = /action="([^"]+)"/g;
let matchAction;
const actions = [];
while ((matchAction = actionRegex.exec(html)) !== null) {
  actions.push(matchAction[1]);
}
console.log("Form actions:", actions);

