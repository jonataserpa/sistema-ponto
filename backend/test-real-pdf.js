const path = require('path');

// Importar o serviço compilado
const pdfService = require('./dist/service/pdfService.js').default;

async function testarPdfReal() {
  console.log('=== Teste com PDF Real ===');
  
  try {
    // Caminho para o PDF real
    const pdfPath = path.join(__dirname, 'Relatorio Ponto para utilizar no sistema (1).pdf');
    
    console.log('Processando PDF:', pdfPath);
    
    // Verificar se o arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(pdfPath)) {
      console.error('Arquivo PDF não encontrado:', pdfPath);
      return;
    }
    
    console.log('Arquivo encontrado, iniciando processamento...');
    
    // Processar o PDF usando o método público
    const resultado = await pdfService.processarEspelhoPonto(pdfPath);
    
    console.log('\n=== Resultado do Processamento ===');
    console.log('Arquivo processado:', resultado.arquivo.processado);
    console.log('Total de registros:', resultado.totalProcessados);
    console.log('Erros:', resultado.erros.length);
    
    if (resultado.erros.length > 0) {
      console.log('Detalhes dos erros:');
      resultado.erros.forEach((erro, index) => {
        console.log(`  ${index + 1}. ${erro}`);
      });
    }
    
    console.log('\n=== Registros Extraídos ===');
    resultado.registros.forEach((registro, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      console.log('- Colaborador:', registro.colaborador.nome);
      console.log('- Matrícula:', registro.colaborador.matricula);
      console.log('- Data:', registro.data);
      console.log('- É Falta:', registro.falta);
      console.log('- Batidas:', registro.batidas.length);
      registro.batidas.forEach((batida, i) => {
        console.log(`  ${i + 1}. ${batida.tipo}: ${batida.horario}`);
      });
      console.log('- Atraso (min):', registro.atrasoMinutos);
      console.log('- Extra (min):', registro.extraMinutos);
    });
    
    // Verificar se os registros foram salvos no banco
    console.log('\n=== Verificação no Banco ===');
    const registroRepository = require('./dist/repository/registroRepository.js').default;
    
    // Buscar todos os registros recentes
    const todosRegistros = await registroRepository.findAll();
    console.log(`Total de registros no banco: ${todosRegistros.length}`);
    
    // Mostrar os últimos 5 registros
    const ultimosRegistros = todosRegistros.slice(-5);
    console.log('\nÚltimos registros no banco:');
    ultimosRegistros.forEach((registro, index) => {
      console.log(`${index + 1}. ID: ${registro.id}, Colaborador: ${registro.colaboradorId}, Data: ${registro.data}, Falta: ${registro.falta}`);
    });
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarPdfReal().catch(console.error); 