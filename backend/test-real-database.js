// Teste real com banco de dados
const fs = require('fs').promises;
const path = require('path');

// Simular um arquivo PDF com o texto de exemplo
const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

async function testarPdfServiceReal() {
  try {
    console.log('=== TESTE REAL COM PDFSERVICE ===\n');
    
    // Importar o pdfService real (compilado)
    const pdfService = require('./dist/service/pdfService').default;
    
    console.log('✓ PdfService importado com sucesso');
    
    // Criar um arquivo temporário com o texto de exemplo
    console.log('\n1. Criando arquivo temporário...');
    const tempFilePath = path.join(__dirname, 'temp-test.txt');
    await fs.writeFile(tempFilePath, sampleText);
    console.log(`✓ Arquivo temporário criado: ${tempFilePath}`);
    
    // Testar o processamento completo
    console.log('\n2. Processando arquivo...');
    
    try {
      const result = await pdfService.processarEspelhoPonto(tempFilePath);
      
      console.log('\n3. Resultado do processamento:');
      console.log(`   - Arquivo processado: ${result.arquivo.processado}`);
      console.log(`   - Total de registros: ${result.totalProcessados}`);
      console.log(`   - Erros: ${result.erros.length}`);
      
      if (result.erros.length > 0) {
        console.log('   - Detalhes dos erros:');
        result.erros.forEach((erro, index) => {
          console.log(`     ${index + 1}. ${erro}`);
        });
      }
      
      console.log('\n4. Registros extraídos:');
      result.registros.forEach((registro, index) => {
        console.log(`   Registro ${index + 1}:`);
        console.log(`     - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
        console.log(`     - Falta: ${registro.falta}`);
        console.log(`     - Batidas: ${registro.batidas.length}`);
        registro.batidas.forEach((batida, i) => {
          console.log(`       ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
        });
      });
      
    } catch (processError) {
      console.error('✗ Erro no processamento:', processError);
    }
    
    // Limpar arquivo temporário
    await fs.unlink(tempFilePath);
    console.log('\n✓ Arquivo temporário removido');
    
    // Verificar se os dados foram salvos no banco
    console.log('\n5. Verificando dados no banco...');
    
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    
    // Verificar colaboradores
    const anaLucia = await colaboradorRepository.findByMatricula('886');
    const elisaEster = await colaboradorRepository.findByMatricula('6861');
    
    console.log('\n   Colaboradores no banco:');
    if (anaLucia) {
      console.log(`   ✓ ANA LUCIA encontrada: ID ${anaLucia.id}, Nome: ${anaLucia.nome}`);
      
      // Verificar registros da Ana Lucia
      const registroAna = await registroRepository.findByDataColaborador(new Date('2025-05-05'), anaLucia.id);
      if (registroAna) {
        console.log(`     ✓ Registro encontrado: Data: ${registroAna.data.toISOString().split('T')[0]}, Falta: ${registroAna.falta}, Batidas: ${registroAna.batidas.length}`);
      } else {
        console.log(`     ✗ Nenhum registro encontrado para 05/05/2025`);
      }
    } else {
      console.log('   ✗ ANA LUCIA não encontrada no banco');
    }
    
    if (elisaEster) {
      console.log(`   ✓ ELISA ESTER encontrada: ID ${elisaEster.id}, Nome: ${elisaEster.nome}`);
      
      // Verificar registros da Elisa
      const registroElisa = await registroRepository.findByDataColaborador(new Date('2025-05-05'), elisaEster.id);
      if (registroElisa) {
        console.log(`     ✓ Registro encontrado: Data: ${registroElisa.data.toISOString().split('T')[0]}, Falta: ${registroElisa.falta}, Batidas: ${registroElisa.batidas.length}`);
        registroElisa.batidas.forEach((batida, i) => {
          console.log(`       ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
        });
      } else {
        console.log(`     ✗ Nenhum registro encontrado para 05/05/2025`);
      }
    } else {
      console.log('   ✗ ELISA ESTER não encontrada no banco');
    }
    
  } catch (error) {
    console.error('\n✗ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarPdfServiceReal().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Erro fatal:', error);
  process.exit(1);
}); 