const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const winston = require('winston');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuração do logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Log no console
        new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log em arquivo para erros
        new winston.transports.File({ filename: 'combined.log' }) // Log em arquivo para todas as mensagens
    ],
});

// Rota para processar perguntas
app.post('/api/perguntas', async (req, res) => {
    const pergunta = req.body.pergunta;

    logger.info(`Pergunta recebida: ${pergunta}`); // Log da pergunta recebida

    try {
        const { resposta, fonte, aviso } = await buscarResposta(pergunta);
        res.json({ resposta, fonte, aviso });
    } catch (error) {
        logger.error(`Erro ao processar a pergunta: ${error.message}`); // Log de erro
        res.status(500).json({ error: 'Erro ao buscar a resposta' });
    }
});

const buscarResposta = async (pergunta) => {
    const apiKey = 'AIzaSyDKHIAiE3NMpDxEZqpjrCYb8LpkrAd3NjY'; // Substitua pela sua chave de API

    const requestBody = {
        contents: [{
            parts: [{ text: pergunta }]
        }]
    };

    try {
        logger.info(`Chamando a API com a pergunta: ${pergunta}`);
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const respostaText = response.data.candidates[0].content.parts[0].text; // Ajuste conforme a resposta da API
        logger.info(`Resposta obtida da API: ${respostaText}`);

        // Verificar se a resposta é consistente com a doutrina católica
        const { isConforme, fonte } = verificarDoutrinaCatolica(respostaText);
        let aviso = '';

        if (!isConforme) {
            aviso = 'A resposta pode não estar em conformidade com a doutrina católica.';
        }

        return { resposta: respostaText, fonte, aviso };
    } catch (error) {
        logger.error(`Erro ao chamar a API do Gemini: ${error.message}`);
        throw new Error('Erro ao buscar resposta da API');
    }
};

// Função para verificar se a resposta está em conformidade com a doutrina católica
const verificarDoutrinaCatolica = (resposta) => {
    // Aqui você pode implementar a lógica para verificar se a resposta está em conformidade
    // com documentos reconhecidos pelo Vaticano, como o Catecismo da Igreja Católica, encíclicas, etc.
    // Isso pode incluir palavras-chave ou referências específicas.

    // Exemplo básico (pode ser expandido):
    const documentosReconhecidos = [
        "Catecismo da Igreja Católica",
        "Encíclica",
        "Concílio",
        // Adicione mais documentos conforme necessário
    ];

    let fonte = 'Fonte: Documento não reconhecido';
    let isConforme = true;

    for (const documento of documentosReconhecidos) {
        if (resposta.includes(documento)) {
            fonte = `Fonte: ${documento}`; // Atualiza a fonte se o documento for reconhecido
            isConforme = true;
            return { isConforme, fonte };
        }
    }

    // Se não encontrou nenhum documento reconhecido
    isConforme = false;
    return { isConforme, fonte };
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`); // Log de inicialização do servidor
});