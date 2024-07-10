
window.container = document.getElementById('pagebody')
window.search = document.getElementById('search')
window.contents = document.getElementById('contents')

let data = []
let paths = []
let currentPath = []
let completed = []
let saved = []
let currentPage = ''
let tabfunction = ''
let tabbed = []

if (localStorage.getItem('completed')) {
    completed = JSON.parse(localStorage.getItem('completed'))
}
if (localStorage.getItem('saved')) {
    saved = JSON.parse(localStorage.getItem('saved'))
}

let headings = [];

let filterCondition = {
    sortby: 'alphabetic',
    subjects: 'all',
    level: 'all',
    filterread: false,
    filtertest: false,
    reverse: false
}

let tabItems = [
    {
        name: 'Home',
        count: data.length
    },
    {
       name: 'Saved',
       count: saved.length 
    }
]

let tag_names = {
    h1: 1,
    h2: 1,
    h3: 1,
    h4: 1,
    h5: 1,
    h6: 1
};

function walk(root) {
    if (root.nodeType === 1 && root.nodeName !== 'script') {
        if (tag_names.hasOwnProperty(root.nodeName.toLowerCase())) {
            headings.push({ heading: root, content: root.nextElementSibling });
        } else {
            for (let i = 0; i < root.childNodes.length; i++) {
                walk(root.childNodes[i]);
            }
        }
    }
}

fetch('https://flippont.github.io/redact/src/data.json')
    .then((response) => response.json())
    .then((json) => {
        data = json;
        fetch('https://flippont.github.io/redact/src/paths.json')
            .then((response) => response.json())
            .then((json) => {
                paths = json;
                init()
            });
    });

let html = {
    'home': {
        url: 'home',
        onenter: () => {
            for(let i=0; i<5;i++) {
                document.getElementById('recent').appendChild(drawCard(data[Math.floor(Math.random()*data.length)]))
            }
            if(saved.length > 0) {
                for(let i=0; i<saved.length; i++) {
                    for(let j=0; j<data.length; j++) {
                        if(data[j].title == saved[i]) {
                            document.getElementById('starred').appendChild(drawCard(data[j]))
                        }
                    }
                }
            } else {
                let nonecontainer = document.createElement('div')
                nonecontainer.className = 'notFound'
                nonecontainer.innerHTML = 'No articles saved.... Yet'
                document.getElementById('starred').appendChild(nonecontainer)
            }
            for(let i=0; i<5; i++) {
                document.getElementById('favs').appendChild(drawCard(data[data.length - (i + 1)]))
            }        
        }
    },
    'list': {
        url: 'list',
        onenter: () => {
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                let path = url.searchParams.get('p').split(',');
                currentPath = url.searchParams.get('p').split(',');
                let objects = findPath(path, paths, path.length - 1, [], 'subs');
                if (objects) {
                    renderLists(objects[0], true)
                } else {
                    objects = []
                    renderLists(objects[0], true)
                }
            } else {
                renderLists(paths, true)
            }
        }
    },
    'about': {
        url: 'about'
    },
    'articles': {
        url: 'articles',
        onenter: () => {
            document.getElementById('results').innerHTML = data.length;
            for(let i=0; i<data.length; i++) {
                let contents = document.createElement('div')
                let popup = document.createElement('div')
                popup.className = 'tooltip'
                popup.innerHTML = data[i].title
                console.log(data[i])
                contents.className = 'coloured';
                contents.style.background = paths[findPath([data[i].path[0]], paths, 0, [], 'location')[0]].colour;
                contents.innerHTML = paths[findPath([data[i].path[0]], paths, 0, [], 'location')[0]].name[0]
                contents.appendChild(popup)
                contents.onclick = () => {
                    currentPage = { url: data[i].url, title: data[i].title }
                    currentPath = data[i].path
                    changePage('article')
                }
                document.getElementById('articles').appendChild(contents)
            }
        }
    },
    'search': {
        url: 'search',
        onenter: () => {
            let url = new URL(location);
            url.searchParams.delete('p')
            document.getElementById('sortby').value = filterCondition.sortby
            document.getElementById('sortby').onchange = () => {
                filterCondition.sortby = document.getElementById('sortby').value
                findArticle(window.search.value)
            }

            findArticle(window.search.value)
        }
    },
    'test': {
        url: 'test',
        onenter: () => {
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                currentPath = url.searchParams.get('p').split(',')
            }
            fetch('https://flippont.github.io/redact/src/quiz/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                .then((response) => response.text())
                .then((text) => {
                    document.getElementById('test').innerHTML = text
                    let total = Array.from(container.getElementsByClassName('questions'))
                    for (let i = 0; i < total.length; i++) {
                        var radiosName = document.getElementsByName('answer-' + i);
                        for (let j = 0; j < radiosName.length; j++) {
                            radiosName[j].onclick = () => {
                                updateProgress(i, total.length)
                            }
                        }
                    }
                    updateProgress(-1, total.length)
                })
                .catch((error) => {
                    console.log(error)
                })
        }
    },
    'article': {
        url: 'article',
        onenter: () => {
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                currentPath = url.searchParams.get('p').split(',')
            }
            fetch('https://flippont.github.io/redact/src/pages/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                .then((response) => response.text())
                .then((text) => {
                    document.getElementById('article').innerHTML = text
                    if (!completed.includes(currentPage.title)) {
                        completed.push(currentPage.title)
                        localStorage.setItem('completed', JSON.stringify(completed))
                    }

                    document.body.style.backgroundImage = 'linear-gradient(#e66465, #9198e5);'
                    headings = []
                    walk(document.getElementById('article'));
                    document.getElementById('title').innerHTML = currentPage.title;
                    document.getElementById('star').style.fill = saved.includes(currentPage.title) ? '#e9ba26' : '#ccc';
                    document.getElementById('star').onclick = () => {
                        saveArticle(document.getElementById('star'), currentPage.title)
                    }
                    document.getElementById('article').innerHTML = ''
                    if (headings.length > 1) {
                        window.contents.innerHTML = '<h2>Table of Contents</h2>'
                        let container = document.createElement('div')
                        for (let i = 0; i < headings.length; i++) {
                            let box = document.createElement('div')
                            box.className = 'box'
                            let boxHead = document.createElement('div')
                            boxHead.className = 'boxTop'
                            boxHead.innerHTML = '<h2 id=' + headings[i].heading.innerHTML.replace(/\s/g, '-').toLowerCase() + '>' + headings[i].heading.innerHTML + '</h2>';
                            let boxBody = document.createElement('div')
                            boxBody.className = 'boxBottom'
                            boxBody.innerHTML = headings[i].content.innerHTML;
                            box.appendChild(boxHead);
                            box.appendChild(boxBody);
                            document.getElementById('article').appendChild(box)
                            let header = document.createElement('button')
                            header.className = 'contentsButton'
                            header.innerHTML =  headings[i].heading.innerHTML.replace(':', '');
                            header.onclick = (() => { 
                                window.scrollTo(0, document.getElementById(headings[i].heading.innerHTML.replace(/\s/g, '-').toLowerCase()).offsetTop - 10)
                            })
                            container.appendChild(header)
                        }
                        window.contents.appendChild(container)
                    } else {
                        let box = document.createElement('div')
                        box.className = 'box'
                        let boxBody = document.createElement('div')
                        boxBody.className = 'boxBottom'
                        boxBody.innerHTML = text;
                        box.appendChild(boxBody);
                        document.getElementById('article').appendChild(box)
                        document.getElementById('contentscont').hidden = 'true'
                    }
                    fetch('https://flippont.github.io/redact/src/quiz/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Not 2xx response", { cause: response });
                            } else {
                                response.text()
                            }
                        })
                        .then((text) => {
                            let button = document.createElement('button');
                            button.innerHTML = '<h2>Take Test</h2>'
                            button.className = 'testBtn'
                            button.onclick = (() => {
                                changePage('test')
                            })
                            document.getElementById('extras').appendChild(button)
                        })
                        .catch((error) => {
                            console.log(error)
                        })

                })
        }
    },
}

let checkArray = [-1]
function updateProgress(element, total) {
    document.getElementById('progress').innerHTML = ''
    if(!checkArray.includes(element)) {
        checkArray.push(element)
    }
    let progress = document.createElement('div');
    progress.className = 'progress'
    progress.style.boxShadow = (280 * ((checkArray.length - 1) / total)) + 'px 0px #000 inset'
    document.getElementById('progress').appendChild(progress)
}
function saveArticle(starElement, save) {
    if (!saved.includes(save)) {
        starElement.style.fill = '#e9ba26';
        saved.push(save)
    } else {
        starElement.style.fill = '#ccc';
        saved.splice(saved.indexOf(save), 1)
    }
    localStorage.setItem('saved', JSON.stringify(saved))
}
let state = {
    path: [],
    page: 'home',
    current: ''
};
function resetURL() {
    currentPage = []
    currentPath = []
    const url = new URL(location);
    if (url.searchParams.get('l')) {
        url.searchParams.delete('l')
    }
    if (url.searchParams.get('p')) {
        url.searchParams.delete('p')
    }
    if (url.searchParams.get('q')) {
        url.searchParams.delete('q')
    }
    if (url.searchParams.get('n')) {
        url.searchParams.delete('n')
    }
    history.replaceState({}, null, url);
}

function getResults() {
    let amountCorrect = 0;
    let container = document.getElementById('test');
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[0].disabled = true
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            let radiosValue = radiosName[j];
            radiosValue.disabled = true
            if (radiosValue.checked) {
                if (radiosValue.value == 'correct') {
                    amountCorrect++;
                    document.getElementById('question-' + i).style.background = '#90be6d6a';
                } else {
                    document.getElementById('question-' + i).style.background = '#ef476f6a';
                }
            } else {
                if (radiosValue.value == 'correct') {
                    radiosValue.style.boxShadow = '0pt 0pt 0pt 10pt #1b9aaa inset'
                }
            }
        }
    }

    document.getElementById('results').innerHTML =
        'Score: ' + amountCorrect + '/' + total.length;

}
function reset() {
    let container = document.getElementById('test');
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[0].disabled = false
    checkArray = [-1]
    updateProgress(-1, total.length)
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            radiosName[j].checked = false
            radiosName[j].disabled = false
            radiosName[j].style.boxShadow = 'none'
            document.getElementById('question-' + i).style.background = 'var(--element)';
        }
    }
}

function findArticle(term) {
    if (!document.getElementById('container')) return
    let matches = [];
    document.getElementById('container').innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        let container = data[i].title + data[i].excerpt + data[i].path[0];
        if (container.toLowerCase().includes(term.toLowerCase())) {
            if(filterCondition.filterread && completed.includes(data[i].title) || filterCondition.filtertest && data[i].test == undefined) {
            } else {
                if(filterCondition.subjects != 'all' || filterCondition.level != 'all') {
                    let checkedSubject = false;
                    let checkedLevel = false;
                    let levels = ['first', 'second', 'third']
                    if(filterCondition.subjects != 'all') {
                        if(data[i].path[0] == filterCondition.subjects) {
                            checkedSubject = true;
                        }
                    } else {
                        checkedSubject = true;
                    }
                    if(filterCondition.level != 'all') {
                        if(filterCondition.level == levels[data[i].level - 1]) {
                            checkedLevel = true;
                        }
                    } else {
                        checkedLevel = true;
                    }
                    if(checkedLevel && checkedSubject) {
                        matches.push(data[i])
                    }
                } else {
                    matches.push(data[i]);
                }
            }
        }
    }
    matches.sort((a, b) => {
        if(filterCondition.sortby == 'level') { 
            return parseFloat(a.level) - parseFloat(b.level)
        } else if(filterCondition.sortby == 'alphabetic') {
            console.log(a.name)
            if(a.title < b.title) {
                return -1;
            }
            if(a.title > b.title) {
                return 1;
            }
            return 0;
        } else {
            return a - b
        }
    })
    if(filterCondition.reverse) {
        matches.reverse()
    }
    for(let i=0; i < matches.length; i++) {
        document.getElementById('container').appendChild(drawCard(matches[i]))
    }
    if (matches.length == 0) {
        let nonecontainer = document.createElement('div')
        nonecontainer.className = 'notFound'
        nonecontainer.innerHTML = 'No results found'
        document.getElementById('container').appendChild(nonecontainer)
    }
    document.getElementById('resuls').innerHTML = matches.length;
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function findPath(path, createdPath, subdivision, finalPath, type) {
    for (let i = 0; i < createdPath.length; i++) {
        if (path[subdivision] == createdPath[i].name) {
            if (type == 'location') {
                finalPath.push(i)
            } else {
                finalPath.push(createdPath[i].subs)
            }
            if (createdPath[i].subs) {
                return findPath(path, createdPath[i].subs, (subdivision + 1), finalPath, type)
            }
        }
        if (finalPath.length == path.length) {
            return finalPath
        }
    }
}

function createTab(name, articles, active = false) {
    let tab = document.createElement('div');
    tab.className = 'tab';
    if(active) {
        tab.classList.add('active')
    }
    let tabhead = document.createElement('div');
    tabhead.innerHTML = name;
    tabhead.className = 'tabhead'
    let tabjoin = document.createElement('div');
    tabjoin.innerHTML = articles + ' articles';
    tabjoin.className = 'tabjoin';
    let cross = document.createElement('div')
    cross.innerHTML = '×'
    cross.className = 'cross'
    tab.appendChild(tabhead)
    tab.appendChild(tabjoin)
    tab.appendChild(cross)

    tab.onclick = () => {
        let elements = document.getElementsByClassName('tab');
        for(let i = 0; i < elements.length; i++) {
            elements[i].classList.remove('active')
        }
        tab.classList.add('active')
        tabfunction = name;
        renderTabList()
    }
    return tab
}
function drawCard(data) {
    let mainElement = document.createElement('div')
    let articleItem = document.createElement('div')
    let colourItem = document.createElement('div')
    colourItem.className = 'colouring'
    colourItem.style.background = paths[findPath([data.path[0]], paths, 0, [], 'location')[0]].colour
    colourItem.innerHTML = paths[findPath([data.path[0]], paths, 0, [], 'location')[0]].name[0];

    articleItem.innerHTML = `
        <div class='floater'>
            <h1>${data.title}</h1>
            ${(data.author) ? '<h4 style="color: gray; margin: 0px;">' + data.author + '</h4>' : ''}
            ${data.excerpt}
        </div>
        
        `;
    articleItem.className = 'article'
    articleItem.tabIndex = '0'
    articleItem.onkeyup = (event) => {
        if (event.key == 'Enter') {
            currentPage = { url: data.url, title: data.title }
            currentPath = data.path
            changePage('article')
        }
    }
    articleItem.onclick = () => {
        currentPage = { url: data.url, title: data.title }
        currentPath = data.path
        changePage('article')
    }
    colourItem.onclick = () => {
        currentPath = data.path
        changePage('list')
    }
    mainElement.appendChild(colourItem)
    mainElement.appendChild(articleItem)
    return mainElement
}
function calculatePercentage(listName) {
    let totalNumber = 0;
    let itemNumber = 0;
    for (const item of data) {
        if (!listName.includes(',') && item.path[0] == listName) {
            if (completed.includes(item.title)) {
                itemNumber += 1;
            }
            totalNumber += 1;
        }
        if (item.path == listName) {
            if (completed.includes(item.title)) {
                itemNumber += 1;
            }
            totalNumber += 1;
        }
    }
    if (totalNumber == 0) {
        totalNumber = 1
    }
    return (itemNumber / totalNumber)
}
function renderTabList(){
    document.getElementById('mainlist').innerHTML = ''
    if (tabfunction == 'Saved') {
        for (let i = 0; i < saved.length; i++) {
            for (let dat of data) {
                if(saved[i] == dat.title) {
                    document.getElementById('mainlist').appendChild(drawCard(dat));
                }
            }
        }
    } else if (tabfunction == 'Home') {
        for (let i = 0; i < data.length; i++) {
            document.getElementById('mainlist').appendChild(drawCard(data[i]));
        }
    }
}
function renderLists(path, popstate = false) {
    if (!popstate) {
        state.path = currentPath;
        state.page = 'list'
        const url = new URL(location);
        url.searchParams.set("l", "list");
        url.searchParams.set("p", currentPath.join(','))
        history.pushState(state, "", url);
    }

    let list = [];
    document.getElementById('extras').innerHTML = `<a onclick="resetURL(); changePage('list')">Home</a>`;
    for (let i = 0; i < currentPath.length; i++) {
        let between = document.createElement('span');
        between.innerHTML = ' / ';
        document.getElementById('extras').appendChild(between);

        let element = document.createElement('a')
        element.innerHTML = currentPath[i]
        list.push(currentPath[i])
        let calc = findPath(list, paths, 0, [], 'subs');
        let calcName = JSON.stringify(list);
        element.tabIndex = '0'
        element.onclick = () => {
            currentPath = JSON.parse(calcName);
            console.log(calcName, calc[calc.length - 1])
            renderLists(calc[calc.length - 1]);
        }
        element.onkeydown = (event) => {
            if (event.key == 'Enter') {
                currentPath = JSON.parse(calcName);
                renderLists(calc[calc.length - 1]);
            }
        }
        document.getElementById('extras').appendChild(element);

    }

    document.getElementById('subjects').innerHTML = '';
    let noCards = 0;

    for (let i = 0; i < data.length; i++) {
        if (arraysEqual(data[i].path, currentPath)) {
            noCards+=1;
            document.getElementById('subjects').appendChild(drawCard(data[i]))
        }
    }

    if(!path && noCards == 0) {
        document.getElementById('subjects').innerHTML = ''
        let nonecontainer = document.createElement('div')
        nonecontainer.className = 'notFound'
        nonecontainer.innerHTML = 'No articles found under this directory: Under construciton'
        document.getElementById('subjects').appendChild(nonecontainer)
    }

    if (!path) return true

    for (let i = 0; i < path.length; i++) {

        let nestFile = document.createElement('div');
        nestFile.className = 'list'
        nestFile.tabIndex = '0'

        nestFile.onkeyup = (event) => {
            if (event.key == 'Enter') {
                currentPath.push(path[i].name)
                renderLists(path[i].subs)
            }
        }
        nestFile.onclick = () => {
            currentPath.push(path[i].name)
            renderLists(path[i].subs)
        }

        let clrWidth = calculatePercentage(currentPath.join(',') + ((currentPath.length > 0) ? ',' : '') + path[i].name)
        let clrHue = (path[i].colour) ? path[i].colour :
            paths[findPath(currentPath, paths, 0, [], 'location')[0]].colour
        nestFile.style.boxShadow = 'inset ' + (clrWidth * (Math.min(window.innerWidth, 980) - 374)) + 'px 0 rgba(154, 255, 140, 0.2)';
        let colourItem = document.createElement('div');
        colourItem.style.background = clrHue;
        colourItem.className = 'colouring';
        let initial = paths[findPath(currentPath, paths, 0, [], 'location')[0]];
        colourItem.innerHTML = (initial != undefined) ? initial.name[0] : path[i].name[0];
        nestFile.appendChild(colourItem);
        nestFile.innerHTML += path[i].name;
        document.getElementById('subjects').appendChild(nestFile)
    }
}

let screen = 'home'
let previousScreen = screen

function changePage(newScene, popstate = false) {
    window.scrollTo(0, 0)
    window.contents.innerHTML = ''

    if (!popstate) {
        state.page = newScene;
        console.log(state.page)
        const url = new URL(location);
        url.searchParams.set('l', newScene);
        if (newScene == 'search') {
            url.searchParams.set('q', window.search.value)
        } else if (newScene == 'article') {
            state.path = currentPath
            state.current = currentPage
            console.log(currentPage)
            url.searchParams.set('p', currentPath.join(','))
            url.searchParams.set('n', currentPage.url + ',' + currentPage.title)
        } else if (newScene == 'list') {
            state.path = currentPath
            url.searchParams.set('p', currentPath.join(','))
        } else {
            state.path = []
            state.current = []
        }
        history.pushState(state, null, url);
    }
    if (html[newScene] && html[newScene].url) {
        fetch('https://flippont.github.io/redact/src/components/' + html[newScene].url + '.html')
            .then((response) => response.text())
            .then((text) => {
                window.container.innerHTML = text
                if (html[newScene] && html[newScene].onenter) {
                    html[newScene].onenter()
                }
                if (html[screen] && html[screen].onexit) {
                    html[screen].onexit()
                }
            })
    }

    previousScreen = screen
    screen = newScene
}

init = () => {
    currentPath = []
    const url = new URL(location);
    if (url.searchParams.get('q')) {
        window.search.value = url.searchParams.get('q');
    }
    if (url.searchParams.get('n')) {
        currentPage = { url: url.searchParams.get('n').split(',')[0], title: url.searchParams.get('n').split(',')[1] }
        console.log(currentPage)
    }
    if (url.searchParams.get('l')) {
        changePage(url.searchParams.get('l'), true)
    } else {
        changePage('home', true)
    }
}

window.onpopstate = (event) => {
    if (event.state) { state = event.state; }
    if (state.page == 'article') {
        currentPage = state.current
    }
    console.log(state.path, state.page)
    if (state.page == 'home') {
        currentPath = []
    } else if (state.path.length > 1 && state.page != 'article') {
        currentPath = state.path.pop()
    } else {
        currentPath = state.path
    }
    changePage(state.page, true)
}
window.search.onkeydown = (event) => {
    if (event.key == 'Enter') {
        changePage('search')
    }
}
