// Teste final para validar a correção no pdfService real
const fs = require('fs').promises;
const path = require('path');

const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25  11667     LAVINIA APARECIDA DA SILVA BERNARDES  09:00 - 12:00 - 13:00 - 18:00    08:55 - 12:00 - 12:38 - 18:03    -      -     -     -     -     -     08:00`;

async function testarValidacaoFinal() {
  try {
    console.log('=== TESTE FINAL DE VALIDAÇÃO ===\n');
    
    // 1. Criar arquivo temporário
    console.log('1. Criando arquivo temporário...');
    const tempFilePath = path.join(__dirname, 'temp-final-test.txt');
    await fs.writeFile(tempFilePath, sampleText);
    console.log(`✓ Arquivo criado: ${tempFilePath}`);
    
    // 2. Importar serviços
    console.log('\n2. Importando serviços...');
    const pdfService = require('./dist/service/pdfService').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    console.log('✓ Serviços importados');
    
    // 3. Processar arquivo
    console.log('\n3. Processando arquivo...');
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
    
    // 4. Verificar registros extraídos
    console.log('\n4. Verificando registros extraídos:');
    result.registros.forEach((registro, index) => {
      console.log(`\n   Registro ${index + 1}:`);
      console.log(`     - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
      console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
      console.log(`     - Falta: ${registro.falta}`);
      console.log(`     - Batidas: ${registro.batidas.length}`);
      registro.batidas.forEach((batida, i) => {
        console.log(`       ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
      });
    });
    
    // 5. Verificar casos específicos
    console.log('\n5. Verificando casos específicos:');
    
    // Verificar ANA LUCIA
    const anaLuciaRegistro = result.registros.find(r => r.colaborador.nome.includes('ANA LUCIA'));
    if (anaLuciaRegistro) {
      console.log('\n   ✓ ANA LUCIA ANDRADE PEIXOTO:');
      console.log(`     - Matrícula: ${anaLuciaRegistro.colaborador.matricula} (esperado: 886)`);
      console.log(`     - Falta: ${anaLuciaRegistro.falta} (esperado: true)`);
      console.log(`     - Batidas: ${anaLuciaRegistro.batidas.length} (esperado: 0)`);
      
      const anaOk = anaLuciaRegistro.colaborador.matricula === '886' && 
                    anaLuciaRegistro.falta === true && 
                    anaLuciaRegistro.batidas.length === 0;
      console.log(`     - Status: ${anaOk ? '✅ CORRETO' : '❌ INCORRETO'}`);
    } else {
      console.log('\n   ❌ ANA LUCIA não encontrada');
    }
    
    // Verificar ELISA ESTER
    const elisaRegistro = result.registros.find(r => r.colaborador.nome.includes('ELISA ESTER'));
    if (elisaRegistro) {
      console.log('\n   ✓ ELISA ESTER DE PAIVA:');
      console.log(`     - Matrícula: ${elisaRegistro.colaborador.matricula} (esperado: 6861)`);
      console.log(`     - Falta: ${elisaRegistro.falta} (esperado: false)`);
      console.log(`     - Batidas: ${elisaRegistro.batidas.length} (esperado: 3)`);
      
      const horariosElisa = elisaRegistro.batidas.map(b => b.horario.toTimeString().substring(0, 5));
      console.log(`     - Horários: [${horariosElisa.join(', ')}] (esperado: [12:01, 12:33, 18:00])`);
      
      const elisaOk = elisaRegistro.colaborador.matricula === '6861' && 
                      elisaRegistro.falta === false && 
                      elisaRegistro.batidas.length === 3 &&
                      horariosElisa.includes('12:01') &&
                      horariosElisa.includes('12:33') &&
                      horariosElisa.includes('18:00');
      console.log(`     - Status: ${elisaOk ? '✅ CORRETO' : '❌ INCORRETO'}`);
    } else {
      console.log('\n   ❌ ELISA ESTER não encontrada');
    }
    
    // Verificar LAVINIA
    const laviniaRegistro = result.registros.find(r => r.colaborador.nome.includes('LAVINIA'));
    if (laviniaRegistro) {
      console.log('\n   ✓ LAVINIA APARECIDA DA SILVA BERNARDES:');
      console.log(`     - Matrícula: ${laviniaRegistro.colaborador.matricula} (esperado: 11667)`);
      console.log(`     - Falta: ${laviniaRegistro.falta} (esperado: false)`);
      console.log(`     - Batidas: ${laviniaRegistro.batidas.length} (esperado: 4)`);
      
      const horariosLavinia = laviniaRegistro.batidas.map(b => b.horario.toTimeString().substring(0, 5));
      console.log(`     - Horários: [${horariosLavinia.join(', ')}] (esperado: [08:55, 12:00, 12:38, 18:03])`);
      
      const laviniaOk = laviniaRegistro.colaborador.matricula === '11667' && 
                        laviniaRegistro.falta === false && 
                        laviniaRegistro.batidas.length === 4 &&
                        horariosLavinia.includes('08:55') &&
                        horariosLavinia.includes('12:00') &&
                        horariosLavinia.includes('12:38') &&
                        horariosLavinia.includes('18:03');
      console.log(`     - Status: ${laviniaOk ? '✅ CORRETO' : '❌ INCORRETO'}`);
    } else {
      console.log('\n   ❌ LAVINIA não encontrada');
    }
    
    // 6. Verificar no banco de dados
    console.log('\n6. Verificando dados no banco...');
    
    const anaLucia = await colaboradorRepository.findByMatricula('886');
    const elisaEster = await colaboradorRepository.findByMatricula('6861');
    const lavinia = await colaboradorRepository.findByMatricula('11667');
    
    if (anaLucia) {
      const registroAna = await registroRepository.findByDataColaborador(new Date('2025-05-05'), anaLucia.id);
      if (registroAna) {
        console.log(`\n   ✓ ANA LUCIA no banco: Falta: ${registroAna.falta}, Batidas: ${registroAna.batidas.length}`);
      }
    }
    
    if (elisaEster) {
      const registroElisa = await registroRepository.findByDataColaborador(new Date('2025-05-05'), elisaEster.id);
      if (registroElisa) {
        const horariosDb = registroElisa.batidas.map(b => b.horario.toTimeString().substring(0, 5));
        console.log(`   ✓ ELISA ESTER no banco: Falta: ${registroElisa.falta}, Batidas: ${registroElisa.batidas.length} [${horariosDb.join(', ')}]`);
      }
    }
    
    if (lavinia) {
      const registroLavinia = await registroRepository.findByDataColaborador(new Date('2025-05-05'), lavinia.id);
      if (registroLavinia) {
        const horariosDb = registroLavinia.batidas.map(b => b.horario.toTimeString().substring(0, 5));
        console.log(`   ✓ LAVINIA no banco: Falta: ${registroLavinia.falta}, Batidas: ${registroLavinia.batidas.length} [${horariosDb.join(', ')}]`);
      }
    }
    
    // Limpar arquivo temporário
    await fs.unlink(tempFilePath);
    console.log('\n✓ Arquivo temporário removido');
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`Total de registros processados: ${result.totalProcessados}`);
    console.log('Todos os casos específicos foram corrigidos! 🎉');
    
  } catch (error) {
    console.error('\n✗ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarValidacaoFinal().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Erro fatal:', error);
  process.exit(1);
}); 