// Teste direto do método de extração de texto
const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25  11667     LAVINIA APARECIDA DA SILVA BERNARDES  09:00 - 12:00 - 13:00 - 18:00    08:55 - 12:00 - 12:38 - 18:03    -      -     -     -     -     -     08:00`;

async function testarExtracaoDireta() {
  try {
    console.log('=== TESTE DIRETO DA EXTRAÇÃO ===\n');
    
    // Importar o pdfService
    const pdfService = require('./dist/service/pdfService').default;
    console.log('✓ PdfService importado');
    
    // Acessar o método privado usando reflexão
    const prototype = Object.getPrototypeOf(pdfService);
    const extrairRegistrosDeTexto = prototype.extrairRegistrosDeTexto;
    
    if (!extrairRegistrosDeTexto) {
      console.error('❌ Método extrairRegistrosDeTexto não encontrado');
      return;
    }
    
    console.log('✓ Método encontrado, executando extração...\n');
    
    // Chamar o método diretamente
    const registros = await extrairRegistrosDeTexto.call(pdfService, sampleText);
    
    console.log('\n=== RESULTADO DA EXTRAÇÃO ===');
    console.log(`Total de registros extraídos: ${registros.length}\n`);
    
    // Verificar cada registro
    registros.forEach((registro, index) => {
      console.log(`Registro ${index + 1}:`);
      console.log(`  - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
      console.log(`  - Data: ${registro.data.toISOString().split('T')[0]}`);
      console.log(`  - Falta: ${registro.falta}`);
      console.log(`  - Batidas: ${registro.batidas.length}`);
      registro.batidas.forEach((batida, i) => {
        console.log(`    ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
      });
      console.log('');
    });
    
    // Verificar casos específicos
    console.log('=== VERIFICAÇÃO DOS CASOS ESPECÍFICOS ===\n');
    
    // ANA LUCIA
    const anaLucia = registros.find(r => r.colaborador.nome.includes('ANA LUCIA'));
    if (anaLucia) {
      console.log('✓ ANA LUCIA ANDRADE PEIXOTO:');
      console.log(`  - Matrícula: ${anaLucia.colaborador.matricula} (esperado: 886)`);
      console.log(`  - Falta: ${anaLucia.falta} (esperado: true)`);
      console.log(`  - Batidas: ${anaLucia.batidas.length} (esperado: 0)`);
      
      const anaOk = anaLucia.colaborador.matricula === '886' && 
                    anaLucia.falta === true && 
                    anaLucia.batidas.length === 0;
      console.log(`  - Status: ${anaOk ? '✅ CORRETO' : '❌ INCORRETO'}\n`);
    } else {
      console.log('❌ ANA LUCIA não encontrada\n');
    }
    
    // ELISA ESTER
    const elisaEster = registros.find(r => r.colaborador.nome.includes('ELISA ESTER'));
    if (elisaEster) {
      console.log('✓ ELISA ESTER DE PAIVA:');
      console.log(`  - Matrícula: ${elisaEster.colaborador.matricula} (esperado: 6861)`);
      console.log(`  - Falta: ${elisaEster.falta} (esperado: false)`);
      console.log(`  - Batidas: ${elisaEster.batidas.length} (esperado: 3)`);
      
      const horariosElisa = elisaEster.batidas.map(b => b.horario.toTimeString().substring(0, 5));
      console.log(`  - Horários: [${horariosElisa.join(', ')}] (esperado: [12:01, 12:33, 18:00])`);
      
      const elisaOk = elisaEster.colaborador.matricula === '6861' && 
                      elisaEster.falta === false && 
                      elisaEster.batidas.length === 3 &&
                      horariosElisa.includes('12:01') &&
                      horariosElisa.includes('12:33') &&
                      horariosElisa.includes('18:00');
      console.log(`  - Status: ${elisaOk ? '✅ CORRETO' : '❌ INCORRETO'}\n`);
    } else {
      console.log('❌ ELISA ESTER não encontrada\n');
    }
    
    // LAVINIA
    const lavinia = registros.find(r => r.colaborador.nome.includes('LAVINIA'));
    if (lavinia) {
      console.log('✓ LAVINIA APARECIDA DA SILVA BERNARDES:');
      console.log(`  - Matrícula: ${lavinia.colaborador.matricula} (esperado: 11667)`);
      console.log(`  - Falta: ${lavinia.falta} (esperado: false)`);
      console.log(`  - Batidas: ${lavinia.batidas.length} (esperado: 4)`);
      
      const horariosLavinia = lavinia.batidas.map(b => b.horario.toTimeString().substring(0, 5));
      console.log(`  - Horários: [${horariosLavinia.join(', ')}] (esperado: [08:55, 12:00, 12:38, 18:03])`);
      
      const laviniaOk = lavinia.colaborador.matricula === '11667' && 
                        lavinia.falta === false && 
                        lavinia.batidas.length === 4 &&
                        horariosLavinia.includes('08:55') &&
                        horariosLavinia.includes('12:00') &&
                        horariosLavinia.includes('12:38') &&
                        horariosLavinia.includes('18:03');
      console.log(`  - Status: ${laviniaOk ? '✅ CORRETO' : '❌ INCORRETO'}\n`);
    } else {
      console.log('❌ LAVINIA não encontrada\n');
    }
    
    // Verificar no banco de dados
    console.log('=== VERIFICAÇÃO NO BANCO DE DADOS ===\n');
    
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    
    const anaLuciaDb = await colaboradorRepository.findByMatricula('886');
    const elisaEsterDb = await colaboradorRepository.findByMatricula('6861');
    const laviniaDb = await colaboradorRepository.findByMatricula('11667');
    
    if (anaLuciaDb) {
      const registroAna = await registroRepository.findByDataColaborador(new Date('2025-05-05'), anaLuciaDb.id);
      if (registroAna) {
        console.log(`✓ ANA LUCIA no banco: Falta: ${registroAna.falta}, Batidas: ${registroAna.batidas.length}`);
      }
    }
    
    if (elisaEsterDb) {
      const registroElisa = await registroRepository.findByDataColaborador(new Date('2025-05-05'), elisaEsterDb.id);
      if (registroElisa) {
        const horariosDb = registroElisa.batidas.map(b => b.horario.toTimeString().substring(0, 5));
        console.log(`✓ ELISA ESTER no banco: Falta: ${registroElisa.falta}, Batidas: ${registroElisa.batidas.length} [${horariosDb.join(', ')}]`);
      }
    }
    
    if (laviniaDb) {
      const registroLavinia = await registroRepository.findByDataColaborador(new Date('2025-05-05'), laviniaDb.id);
      if (registroLavinia) {
        const horariosDb = registroLavinia.batidas.map(b => b.horario.toTimeString().substring(0, 5));
        console.log(`✓ LAVINIA no banco: Falta: ${registroLavinia.falta}, Batidas: ${registroLavinia.batidas.length} [${horariosDb.join(', ')}]`);
      }
    }
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`Total de registros processados: ${registros.length}`);
    
    // Verificar se todos os casos estão corretos
    const todosCorretos = anaLucia && elisaEster && lavinia &&
                         anaLucia.colaborador.matricula === '886' && anaLucia.falta === true && anaLucia.batidas.length === 0 &&
                         elisaEster.colaborador.matricula === '6861' && elisaEster.falta === false && elisaEster.batidas.length === 3 &&
                         lavinia.colaborador.matricula === '11667' && lavinia.falta === false && lavinia.batidas.length === 4;
    
    if (todosCorretos) {
      console.log('🎉 TODOS OS CASOS ESPECÍFICOS FORAM CORRIGIDOS COM SUCESSO! 🎉');
    } else {
      console.log('❌ Ainda há problemas com alguns casos');
    }
    
  } catch (error) {
    console.error('\n✗ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarExtracaoDireta().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Erro fatal:', error);
  process.exit(1);
}); 