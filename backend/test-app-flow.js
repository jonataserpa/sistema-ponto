// Teste que simula o fluxo completo da aplicação
const fs = require('fs').promises;
const path = require('path');

const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

async function testarFluxoCompleto() {
  try {
    console.log('=== TESTE DO FLUXO COMPLETO DA APLICAÇÃO ===\n');
    
    // 1. Criar arquivo temporário (simular upload)
    console.log('1. Criando arquivo temporário...');
    const tempFilePath = path.join(__dirname, 'temp-app-test.txt');
    await fs.writeFile(tempFilePath, sampleText);
    console.log(`✓ Arquivo criado: ${tempFilePath}`);
    
    // 2. Importar serviços
    console.log('\n2. Importando serviços...');
    const pdfService = require('./dist/service/pdfService').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    console.log('✓ Serviços importados');
    
    // 3. Simular o processamento do pdfService (como no controller)
    console.log('\n3. Processando arquivo com pdfService...');
    const result = await pdfService.processarEspelhoPonto(tempFilePath);
    
    console.log(`✓ Processamento concluído:`);
    console.log(`  - Arquivo processado: ${result.arquivo.processado}`);
    console.log(`  - Total de registros: ${result.totalProcessados}`);
    console.log(`  - Erros: ${result.erros.length}`);
    
    if (result.erros.length > 0) {
      console.log('  - Detalhes dos erros:');
      result.erros.forEach((erro, index) => {
        console.log(`    ${index + 1}. ${erro}`);
      });
    }
    
    // 4. Simular a lógica do uploadController.salvarRegistros
    console.log('\n4. Simulando lógica do uploadController.salvarRegistros...');
    
    let registrosSalvos = 0;
    const colaboradoresProcessados = new Set();
    
    console.log(`Iniciando processamento de ${result.registros.length} registros extraídos do PDF`);
    
    // Verificar se há registros para processar
    if (!result.registros || result.registros.length === 0) {
      console.warn("⚠️ Nenhum registro foi extraído do PDF para ser processado");
      return { registrosSalvos: 0, colaboradoresSalvos: 0 };
    }
    
    // Contabilizar colaboradores distintos encontrados
    for (const registro of result.registros) {
      if (registro.colaborador && registro.colaborador.matricula) {
        colaboradoresProcessados.add(registro.colaborador.matricula);
      }
    }
    
    console.log(`Total de colaboradores distintos nos registros: ${colaboradoresProcessados.size}`);
    
    // Processar os registros (como no uploadController)
    console.log('Processando registros de ponto...');
    
    for (const registro of result.registros) {
      try {
        if (!registro.colaborador || !registro.colaborador.matricula) {
          console.warn("Registro sem informações de colaborador válidas, pulando...");
          continue;
        }
        
        const matricula = registro.colaborador.matricula;
        
        console.log(`\n--- Processando registro para matrícula ${matricula} ---`);
        
        // Buscar colaborador pelo matrícula para obter o ID
        const colaborador = await colaboradorRepository.findByMatricula(matricula);
        
        if (colaborador) {
          console.log(`✓ Colaborador encontrado: ID ${colaborador.id}, Nome: ${colaborador.nome}`);
          
          // Verificar se já existe registro para esta data
          const dataRegistro = registro.data;
          const registroExistente = await registroRepository.findByDataColaborador(dataRegistro, colaborador.id);
          
          if (registroExistente) {
            console.log(`⚠️ Registro já existe para ${colaborador.nome} em ${dataRegistro.toISOString().split('T')[0]}`);
            console.log(`   Registro existente: Falta: ${registroExistente.falta}, Batidas: ${registroExistente.batidas.length}`);
          }
          
          // Cria ou atualiza o registro (como no repositório)
          await registroRepository.createOrUpdate(registro, colaborador.id);
          registrosSalvos++;
          console.log(`✓ Registro salvo para colaborador ${matricula} na data ${registro.data.toISOString().split('T')[0]}`);
          
          // Verificar se foi realmente salvo
          const registroVerificacao = await registroRepository.findByDataColaborador(dataRegistro, colaborador.id);
          if (registroVerificacao) {
            console.log(`✓ Verificação: Registro confirmado no banco`);
            console.log(`   - Falta: ${registroVerificacao.falta}`);
            console.log(`   - Batidas: ${registroVerificacao.batidas.length}`);
            registroVerificacao.batidas.forEach((batida, i) => {
              console.log(`     ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
            });
          } else {
            console.log(`✗ Erro: Registro não foi encontrado após salvamento`);
          }
        } else {
          console.warn(`✗ Não foi possível encontrar colaborador com matrícula: ${matricula}`);
          console.warn(`   Este é um erro inesperado já que os colaboradores deveriam ter sido salvos durante a extração`);
        }
      } catch (registroError) {
        console.error(`✗ Erro ao salvar registro:`, registroError);
        // Continua com o próximo registro
      }
    }
    
    console.log(`\n5. RESULTADO FINAL:`);
    console.log(`   - Total de registros salvos: ${registrosSalvos}`);
    console.log(`   - Total de colaboradores processados: ${colaboradoresProcessados.size}`);
    
    // 6. Verificação final no banco
    console.log('\n6. Verificação final no banco...');
    
    const anaLucia = await colaboradorRepository.findByMatricula('886');
    const elisaEster = await colaboradorRepository.findByMatricula('6861');
    
    console.log('\n   Colaboradores no banco:');
    if (anaLucia) {
      console.log(`   ✓ ANA LUCIA encontrada: ID ${anaLucia.id}, Nome: ${anaLucia.nome}`);
      
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
    
    // Limpar arquivo temporário
    await fs.unlink(tempFilePath);
    console.log('\n✓ Arquivo temporário removido');
    
    return { registrosSalvos, colaboradoresSalvos: colaboradoresProcessados.size };
    
  } catch (error) {
    console.error('\n✗ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Executar o teste
testarFluxoCompleto().then((resultado) => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  console.log(`Registros salvos: ${resultado.registrosSalvos}`);
  console.log(`Colaboradores processados: ${resultado.colaboradoresSalvos}`);
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Erro fatal:', error);
  process.exit(1);
}); 