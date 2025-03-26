const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'livros.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ livros: [] }, null, 2));
}
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (pathname === '/api/livros' && req.method === 'GET') {
        listarLivros(res);
    } else if (pathname === '/api/livros' && req.method === 'POST') {
        await adicionarLivro(req, res);
    } else if (pathname === '/api/livros/filtrar' && req.method === 'GET') {
        filtrarLivros(query, res);
    } else if (pathname === '/') {
        serveFile(res, 'index.html');
    } else if (pathname === '/cadastro') {
        serveFile(res, 'cadastro.html');
    } else if (pathname === '/lista') {
        serveFile(res, 'lista.html');
    } else if (pathname === '/filtro') {
        serveFile(res, 'filtro.html');
    } else if (pathname.endsWith('.css')) {
        serveFile(res, pathname.substring(1), 'text/css');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Página não encontrada');
    }
});

function serveFile(res, filename, contentType = 'text/html') {
    const filePath = path.join(PUBLIC_DIR, filename);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            return res.end('Erro ao carregar o arquivo');
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

function listarLivros(res) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Erro ao ler dados' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    });
}

async function adicionarLivro(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(fs.readFileSync(DATA_FILE));
            const novoLivro = JSON.parse(body);
            data.livros.push(novoLivro);
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Livro adicionado com sucesso' }));
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Dados inválidos' }));
        }
    });
}

function filtrarLivros(query, res) {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Erro ao ler dados' }));
        }
        const { livros } = JSON.parse(data);
        const filtrados = livros.filter(livro => {
            return (!query.titulo || livro.titulo.toLowerCase().includes(query.titulo.toLowerCase())) &&
                   (!query.autor || livro.autor.toLowerCase().includes(query.autor.toLowerCase())) &&
                   (!query.genero || livro.genero.toLowerCase().includes(query.genero.toLowerCase())) &&
                   (!query.ano || livro.ano == query.ano);
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ livros: filtrados }));
    });
}

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});