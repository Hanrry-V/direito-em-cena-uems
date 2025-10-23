// js/script.js

// Seu Endpoint URL do SheetDB (Com o ID fornecido)
const urlDoJSON = 'https://sheetdb.io/api/v1/28o7q32wl9r1z'; 

// === FUNÇÕES DE FILTRAGEM E CARREGAMENTO DE ÍNDICE ===

// Onde os posts serão injetados no HTML (apenas para index.html ou participantes.html)
const containerDePosts = document.querySelector('.card-container');

function obterTipoDeAutoria() {
    // Verifica a URL da página atual
    const nomeDoArquivo = window.location.pathname.split('/').pop();
    if (nomeDoArquivo === 'participantes.html') {
        return 'participante';
    } 
    return 'principal'; 
}

function criarCardPost(post) {
    const card = document.createElement('a');
    
    // CRUCIAL: O link agora aponta para a página genérica, passando o ID do post na URL
    card.href = `post.html?id=${post.id}`; 
    card.classList.add('post-card');
    
    // Adiciona classe de destaque visual se for participante
    if (post.autoria === 'participante') {
        card.classList.add('post-participante');
    }
    
    card.innerHTML = `
        <img src="${post.imagem}" alt="Capa da Obra: ${post.titulo}">
        <h4>${post.titulo}</h4>
        <p class="category">Categoria: ${post.categoria}</p>
        <span class="autor-tag">${post.autoria === 'principal' ? 'Coordenação' : 'Participante'}</span>
    `;
    
    return card;
}

async function carregarPostsIndex() {
    if (!containerDePosts) return;

    try {
        const response = await fetch(urlDoJSON);
        if (!response.ok) throw new Error(`Erro ao carregar API: ${response.status}`);
        
        const posts = await response.json();
        const tipoDeAutoria = obterTipoDeAutoria();
        
        const postsFiltrados = posts.filter(post => post.autoria === tipoDeAutoria);
        
        if (postsFiltrados.length > 0) {
            postsFiltrados.forEach(post => {
                containerDePosts.appendChild(criarCardPost(post));
            });
        } else {
            containerDePosts.innerHTML = `<p style="text-align: center; margin: 50px 0;">Ainda não há ${tipoDeAutoria === 'principal' ? 'destaques da coordenação' : 'contribuições de participantes'} publicados.</p>`;
        }
    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        containerDePosts.innerHTML = "<p>Erro ao carregar o conteúdo. Por favor, verifique a conexão do SheetDB.</p>";
    }
}


// === FUNÇÃO PARA A PÁGINA DE DETALHE (post.html) - BUSCA O CONTEÚDO COMPLETO ===

async function carregarPostDetalhe() {
    const postDetailContainer = document.querySelector('.post-detail-container');
    if (!postDetailContainer) return;
    
    // 1. Extrai o ID da URL (?id=4)
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        postDetailContainer.innerHTML = '<h2>Erro: ID da Resenha não encontrado.</h2>';
        return;
    }

    try {
        // 2. Busca o post ESPECÍFICO pelo ID usando o filtro do SheetDB
        const response = await fetch(`${urlDoJSON}/search?id=${postId}`);
        if (!response.ok) throw new Error(`Erro ao carregar o post ID ${postId}`);

        const posts = await response.json();
        const post = posts[0]; // Pega o primeiro resultado da busca

        if (post && post.conteudo_completo) {
            
            // NOVO: Chama a função para converter o texto simples da planilha em HTML
            const conteudoFormatado = formatarTextoParaHTML(post.conteudo_completo);

            // 3. Insere os dados na página
            document.getElementById('post-titulo').textContent = post.titulo;
            document.getElementById('post-meta').textContent = `Categoria: ${post.categoria} | Autoria: ${post.autoria === 'principal' ? 'Coordenação' : 'Participante'}`;
            
            // CRUCIAL: Injeta a imagem de capa e o conteúdo formatado
            document.getElementById('post-conteudo').innerHTML = 
                `<img src="${post.imagem}" alt="Capa da Obra: ${post.titulo}" style="width: 100%; height: auto; margin-bottom: 20px;">` + 
                conteudoFormatado;
            
            document.getElementById('page-title').textContent = post.titulo + ' | Direito em Cena';

        } else {
            postDetailContainer.innerHTML = '<h2>Resenha não encontrada ou conteúdo não preenchido na Planilha.</h2>';
        }

    } catch (error) {
        console.error("Erro ao carregar detalhes do post:", error);
        postDetailContainer.innerHTML = '<h2>Erro ao carregar detalhes. Tente novamente mais tarde.</h2>';
    }
}

// === NOVA FUNÇÃO: CONVERTE TEXTO SIMPLES EM HTML ===
/**
 * Converte o texto simples (com quebras de linha) da planilha em HTML.
 * Transforma ENTER em <br> e ENTER DUPLO em tags de parágrafo (<p>).
 * Transforma **Título** em <h3>Título</h3>.
 */
function formatarTextoParaHTML(textoBruto) {
    if (!textoBruto) return '';
    
    // 1. Converte **Títulos em negrito** em <h3> (Permite títulos de seção sem HTML)
    let html = textoBruto.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>');

    // 2. Transforma quebras de linha (ENTER) em <br>
    html = html.replace(/\n/g, '<br>');

    // 3. Transforma múltiplos <br> seguidos (linha em branco) em fechamento/abertura de parágrafo
    html = html.replace(/(<br>){2,}/g, '</p><p>');

    // 4. Envolve todo o conteúdo em tags <p> iniciais e finais
    // Apenas se o conteúdo não começar com uma tag de cabeçalho (h3)
    if (!html.startsWith('<p>') && !html.startsWith('<h')) {
        html = `<p>${html}`;
    }
    // 5. Garante que o parágrafo feche no final
    if (!html.endsWith('</p>')) {
        html = `${html}</p>`;
    }

    return html;
}


// === LÓGICA DE INICIALIZAÇÃO ===

// Decide qual função rodar baseado na página que está aberta
if (document.querySelector('.card-container')) {
    carregarPostsIndex(); // Roda nas páginas index.html e participantes.html
} else if (document.querySelector('.post-detail-container')) {
    carregarPostDetalhe(); // Roda na página post.html
}