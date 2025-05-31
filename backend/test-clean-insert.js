const fs = require('fs');
const path = require('path');

// Texto simulado de um PDF real
const textoRealPdf = `Departamento: PREFEITURA
Dia     Matrícula    Nome                           Jornada                    Ponto
Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   1032     MARIA APARECIDA ALVES DE MELO                                 Segunda                    -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25  12005     DARLAN VICTOR DE CASTRO E LOPES 07:00 - 12:00 - 13:00 - 16:00   07:06 - 11:57 - 12:58 - 15:59  -      -     -     -     -     -     08:00`;

async function testarLimpezaEInsercao() {
  console.log('=== TESTE DE LIMPEZA E INSERÇÃO ===\n');
  
  try {
    console.log('1. IMPORTANDO SERVIÇOS...');
    const pdfService = require('./dist/service/pdfService').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    console.log('✓ Serviços importados\n');
    
    console.log('2. LIMPANDO REGISTROS DA DATA 05/05/2025...');
    
    // Definir a data específica
    const dataEspecifica = new Date('2025-05-05');
    dataEspecifica.setHours(0, 0, 0, 0);
    
    const dataInicio = new Date(dataEspecifica);
    const dataFim = new Date(dataEspecifica);
    dataFim.setHours(23, 59, 59, 999);
    
    // Buscar registros existentes para a data
    const registrosExistentes = await registroRepository.findAll({
      dataInicio,
      dataFim
    });
    
    console.log(`   Encontrados ${registrosExistentes.length} registros existentes para 05/05/2025`);
    
    // Remover registros existentes
    for (const registro of registrosExistentes) {
      await registroRepository.delete(registro.id);
      console.log(`   ✓ Removido registro ID ${registro.id} - ${registro.colaborador.nome}`);
    }
    
    console.log(`✓ ${registrosExistentes.length} registros removidos\n`);
    
    console.log('3. EXTRAINDO REGISTROS DO TEXTO...');
    
    // Acessar o método privado usando reflexão
    const extrairRegistrosDeTexto = pdfService.extrairRegistrosDeTexto.bind(pdfService);
    
    console.log(`   Texto a processar: ${textoRealPdf.length} caracteres`);
    
    // Executar extração
    const registrosExtraidos = await extrairRegistrosDeTexto(textoRealPdf);
    
    console.log(`✓ ${registrosExtraidos.length} registros extraídos\n`);
    
    console.log('4. VERIFICANDO RESULTADOS...');
    
    // Verificar registros criados
    const novosRegistros = await registroRepository.findAll({
      dataInicio,
      dataFim
    });
    
    console.log(`   Registros criados: ${novosRegistros.length}`);
    
    for (const registro of novosRegistros) {
      console.log(`   ✓ ${registro.colaborador.nome}:`);
      console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
      console.log(`     - Falta: ${registro.falta}`);
      console.log(`     - Batidas: ${registro.batidas.length}`);
      
      if (registro.batidas.length > 0) {
        registro.batidas.forEach((batida, index) => {
          const horario = batida.horario.toTimeString().substring(0, 5);
          console.log(`       ${index + 1}. ${horario} (${batida.tipo})`);
        });
      }
      console.log('');
    }
    
    console.log('5. ESTATÍSTICAS FINAIS:');
    console.log(`   - Registros removidos: ${registrosExistentes.length}`);
    console.log(`   - Registros extraídos: ${registrosExtraidos.length}`);
    console.log(`   - Registros criados: ${novosRegistros.length}`);
    console.log(`   - Com faltas: ${novosRegistros.filter(r => r.falta).length}`);
    console.log(`   - Com presenças: ${novosRegistros.filter(r => !r.falta).length}`);
    
    console.log('\n✓ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarLimpezaEInsercao()
  .then(() => {
    console.log('\n=== FIM DO TESTE ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  }); 