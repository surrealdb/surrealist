const form = document.querySelector('#form');
const output = document.querySelector('#output');
const embed = document.querySelector('#embed');
const datasetField = document.querySelector('#dataset');
const setupField = document.querySelector('#setup');
const queryField = document.querySelector('#query');
const variablesField = document.querySelector('#variables');
const themeField = document.querySelector('#theme');

function parseJson(input) {
    try {
        return JSON.parse(input);
    } catch(_e) {
        return {};
    }
}

form.addEventListener('submit', async (e) => {
    event.preventDefault();

    const data = new FormData(e.target);

    const dataset = data.get('dataset');
    const setup = data.get('setup');
    const query = data.get('query');
    const variables = parseJson(data.get('variables'));
    const theme = data.get('theme');

    const search = new URLSearchParams();

    if (dataset != 'none') search.append('dataset', dataset);
    if (setup && setup.length > 0) search.append('setup', setup);
    if (query && query.length > 0) search.append('query', query);
    if (Object.keys(variables).length > 0) search.append('variables', JSON.stringify(variables));
    if (theme !== 'auto') search.append('theme', theme);

    const url = new URL(location);
    url.pathname = url.hostname == 'localhost' ? 'embed/run.html' : 'embed';
    url.search = search;

    history.replaceState({}, null, `${location.pathname}${search.toString().length > 0 ? '?' + search : ''}`);

    output.value = url;
    embed.innerHTML = `<iframe src="${url}" width="100%" height="550" frameborder="0"></iframe>`;
});

output.addEventListener('input', (e) => {
    updateFromUrl(output.value);
});

function updateFromUrl(input) {
    const url = new URL(input);
    const search = new URLSearchParams(url.search);
    const { dataset, setup, query, variables, theme } = Object.fromEntries(search.entries());
    const parsedVariables = parseJson(variables);
    const validDataSets = [...datasetField.options].map(o => o.value);
    const validThemes = [...themeField.options].map(o => o.value);
    
    datasetField.value = validDataSets.includes(dataset) ? dataset : 'none';
    setupField.value = setup ? setup.toString() : '';
    queryField.value = query ? query.toString() : '';
    variablesField.value = Object.keys(parsedVariables).length > 0 ? JSON.stringify(parsedVariables, null, 4) : '';
    themeField.value = validThemes.includes(theme) ? theme : 'auto';

    form.dispatchEvent(new CustomEvent("submit"));
}

updateFromUrl(location);