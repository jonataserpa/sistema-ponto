const path = require('path');

// Importar o serviço compilado
const pdfService = require('./dist/service/pdfService.js').default;

// Texto de exemplo (mesmo do teste anterior)
const textoExemplo = `Departamento: TECNOLOGIA DA INFORMACAO

05/05/25 1234 ANA LUCIA ANDRADE PEIXOTO 08:00 - 12:00 - 13:00 - 17:00 Falta 08:00 00:00 00:00 00:00 00:00 08:00
05/05/25 5678 ELISA ESTER DE PAIVA 08:00 - 12:00 - 13:00 08:00 - 12:00 - 13:00 08:00 00:00 00:00 00:00 00:00 00:00`;

async function testarProcessamentoTexto() {
  console.log('=== Teste de Processamento de Texto ===');
  
  try {
    // Usar reflexão para acessar o método privado extrairRegistrosDeTexto
    const extrairRegistrosDeTexto = pdfService.extrairRegistrosDeTexto || 
      pdfService.__proto__.extrairRegistrosDeTexto ||
      pdfService.constructor.prototype.extrairRegistrosDeTexto;
    
    if (!extrairRegistrosDeTexto) {
      console.error('Método extrairRegistrosDeTexto não encontrado');
      return;
    }
    
    console.log('Processando texto diretamente...');
    console.log('Tamanho do texto:', textoExemplo.length);
    
    // Chamar o método diretamente
    const registros = await extrairRegistrosDeTexto.call(pdfService, textoExemplo);
    
    console.log('\n=== Resultados ===');
    console.log('Total de registros extraídos:', registros.length);
    
    registros.forEach((registro, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      console.log('- Colaborador:', registro.colaborador.nome);
      console.log('- Matrícula:', registro.colaborador.matricula);
      console.log('- Data:', registro.data);
      console.log('- Tipo Jornada:', registro.tipoJornada);
      console.log('- É Falta:', registro.isFalta);
      console.log('- Batidas:', registro.batidas.length);
      registro.batidas.forEach((batida, i) => {
        console.log(`  ${i + 1}. ${batida.tipo}: ${batida.horario}`);
      });
    });
    
    // Verificar se os registros foram salvos no banco
    console.log('\n=== Verificação no Banco ===');
    const registroRepository = require('./dist/repository/registroRepository.js').default;
    
    for (const registro of registros) {
      const registroDb = await registroRepository.findByColaboradorAndDate(
        registro.colaboradorId, 
        registro.data
      );
      
      if (registroDb) {
        console.log(`✓ Registro encontrado no banco para ${registro.colaborador.nome}`);
        console.log(`  ID: ${registroDb.id}, Tipo: ${registroDb.tipoJornada}`);
      } else {
        console.log(`✗ Registro NÃO encontrado no banco para ${registro.colaborador.nome}`);
      }
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testarProcessamentoTexto().catch(console.error); 