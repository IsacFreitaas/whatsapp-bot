const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const numeroDestinatario = "";

const caminhoMidia = "";

const legenda = "";

function validarWhatsapp(telefoneCliente) {
    let tel = String(telefoneCliente).replace(/\D/g, '');

    // Normaliza para o formato com DDI +55 e DDD.
    // Se tiver 8 ou 9 dígitos (sem DDD), assume o DDD padrão '11' de São Paulo. Modifique se necessário.
    if (tel.length === 8 || (tel.length === 9 && tel.startsWith('9'))) {
        tel = "11" + tel; // Você pode alterar '11' para seu código de área.
    }

    // Se tiver 10 ou 11 dígitos (DDD + número), adiciona o DDI +55.
    if (tel.length === 10 || tel.length === 11) {
        tel = "55" + tel;
    }

    // Remove o nono dígito, se o número estiver no formato 55DDD9NNNNNNNN (13 dígitos).
    if (tel.length === 13 && tel.startsWith('55') && tel.charAt(4) === '9') {
        return tel.slice(0, 4) + tel.slice(5); // Retorna 55DDD + NNNNNNNN
    }

    // Se já estiver no formato correto sem o 9 (55DDDNNNNNNNN) ou não se encaixar na regra, retorna como está.
    return tel;
}


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-bot-session", // Nome do arquivo da sessão
        dataPath: __dirname
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Evento disparado quando o QR Code é gerado
client.on('qr', (qr) => {
    console.log('--------------------------------------------------');
    console.log('📸 Para conectar, escaneie o QR Code abaixo com seu celular:');
    qrcode.generate(qr, { small: true });
    console.log('--------------------------------------------------');
});

// Evento disparado quando a autenticação falha
client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    process.exit(1); // Encerra o script com erro
});

// Evento disparado quando o cliente é desconectado
client.on('disconnected', (reason) => {
    console.warn('⚠️ Cliente desconectado:', reason);
});

// Evento principal: disparado quando o cliente está pronto para uso
client.on('ready', async () => {
    console.log('✅ Cliente conectado e pronto para enviar!');

    try {
        // Valida o número de telefone
        const numeroFormatado = validarWhatsapp(numeroDestinatario);
        const numeroParaEnvio = `${numeroFormatado}@c.us`;

        // Verifica se o arquivo de mídia existe
        if (!fs.existsSync(caminhoMidia)) {
            throw new Error(`Arquivo de mídia não encontrado no caminho: ${caminhoMidia}`);
        }

        // Carrega a mídia
        const media = MessageMedia.fromFilePath(caminhoMidia);

        // Envia a mensagem
        console.log(`\nEnviando para: ${numeroParaEnvio}`);
        console.log(`Legenda: ${legenda}`);
        await client.sendMessage(numeroParaEnvio, media, { caption: legenda });

        console.log('\n✅ Mensagem enviada com sucesso!');

    } catch (error) {
        console.error('\n❌ Ocorreu um erro ao tentar enviar a mensagem:', error.message);
    } finally {
        // Encerra o processo após um curto período para garantir que a mensagem foi enviada
        console.log('\nEncerrando o script em 5 segundos...');
        setTimeout(() => {
            client.destroy();
            process.exit(0);
        }, 5000);
    }
});

// Inicia o cliente
console.log('Iniciando o bot do WhatsApp...');
client.initialize();