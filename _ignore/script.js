function tick(phrases, phraseIndex, charIndex, typing){
    // Check if charIndex = len(phrases[phraseIndex])
    // If true -> set typing to false, else set typing to true
    // if typing is true
    // add phrases[phraseIndex][charIndex]
    // increment charIndex
    // call tick with new charIndex and typing and same everything else
    // if typing is false
    // write phrases[phraseIndex][0:charIndex]
    // decrement charIndex
    // call tick with new charIndex and typing and same everything else
}

const MEDIUM_URL = "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@rohan.krishnan";
const SUBSTACK_URL = "https://api.rss2json.com/v1/api.json?rss_url=https://rohankrishnan.substack.com/feed";

let allArticles = [];

// Function to define how to compare articles when sorting
function formatArticleDate(date){
    const d = new Date(date)
    return d.toLocaleDateString(undefined, {month: "short", year: "numeric"})
}

function sortArticlesByDate(articleA, articleB){
    return -1 * (new Date(articleA.pubDate) - new Date(articleB.pubDate))
}

function renderArticles(source) {

    // Make a shallow copy so that when filteredArticles is mutated with the sort, allArticles isn't affected
    const filteredArticles = source === "all" ? [...allArticles] : allArticles.filter(a => a.source === source)
    const sortedArticles = filteredArticles.sort(sortArticlesByDate)
    
    const list = document.getElementById("article-list");

    if (sortedArticles.length === 0){
        const list = document.getElementById("article-list")
        list.innerHTML = "<p class='empty-state'>No articles found.</p>"
    } else{
        list.innerHTML = "";

        sortedArticles.forEach(article => {
            list.innerHTML += `
                <a href = "${article.link}" target = "_blank">
                    <span class = "article-source">${article.source}</span>
                    <p>${article.title}</p>
                    <span class = "article-date"> ${formatArticleDate(article.pubDate)}</span>
                </a>   
            `;
        });
    }
};

document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        renderArticles(button.dataset.source);
    });
});

Promise.all([
    fetch(MEDIUM_URL).then(r => r.json()).catch(() => ({ items: []})),
    fetch(SUBSTACK_URL).then(r => r.json()).catch(() => ({ items: [] }))
    ]).then(([mediumData, substackData]) => {
        allArticles = [
            ...mediumData.items.map(a => ({...a, source: "Medium"})),
            ...substackData.items.map(a => ({...a, source: "Substack"}))
        ];
        renderArticles("all")
    });