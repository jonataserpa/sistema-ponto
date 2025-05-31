const fs = require('fs');
const path = require('path');

async function testarUploadControllerLimpo() {
  console.log('🧹 TESTE COM LIMPEZA DE REGISTROS EXISTENTES');
  console.log('='.repeat(50));

  try {
    // 1. Verificar se o arquivo PDF existe
    const pdfPath = './Relatorio Ponto para utilizar no sistema (1).pdf';
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Arquivo PDF não encontrado:', pdfPath);
      return;
    }

    console.log('✅ Arquivo PDF encontrado:', pdfPath);
    const stats = fs.statSync(pdfPath);
    console.log(`📊 Tamanho do arquivo: ${stats.size} bytes`);

    // 2. Importar serviços
    console.log('\n📦 Importando serviços...');
    const pdfService = require('./dist/service/pdfService').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;

    // 3. LIMPAR REGISTROS EXISTENTES PARA A DATA 05/05/25
    console.log('\n🧹 Limpando registros existentes para 05/05/25...');
    
    // Converter data para o formato correto
    const dataLimpeza = new Date('2025-05-05');
    dataLimpeza.setHours(0, 0, 0, 0);
    
    // Buscar registros existentes usando findAll com filtros
    const registrosExistentes = await registroRepository.findAll({
      dataInicio: dataLimpeza,
      dataFim: dataLimpeza
    });
    console.log(`📋 Encontrados ${registrosExistentes.length} registros existentes para 05/05/25`);
    
    // Deletar registros existentes
    if (registrosExistentes.length > 0) {
      for (const registro of registrosExistentes) {
        await registroRepository.delete(registro.id);
      }
      console.log(`✅ ${registrosExistentes.length} registros removidos`);
    }

    // 4. Processar o PDF
    console.log('\n📄 Processando PDF...');
    const resultado = await pdfService.processarEspelhoPonto(pdfPath);

    console.log('\n📊 RESULTADO DO PROCESSAMENTO:');
    console.log(`✅ Total de registros processados: ${resultado.totalProcessados}`);
    console.log(`✅ Total de erros: ${resultado.erros.length}`);

    if (resultado.erros.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      resultado.erros.forEach((erro, index) => {
        console.log(`${index + 1}. ${erro}`);
      });
    }

    // 5. Verificar registros criados
    console.log('\n🔍 Verificando registros criados...');
    const novosRegistros = await registroRepository.findAll({
      dataInicio: dataLimpeza,
      dataFim: dataLimpeza
    });
    console.log(`📋 Total de registros criados: ${novosRegistros.length}`);

    if (novosRegistros.length > 0) {
      console.log('\n👥 REGISTROS CRIADOS:');
      for (const registro of novosRegistros) {
        console.log(`\n📝 ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`   📅 Data: ${registro.data.toLocaleDateString('pt-BR')}`);
        console.log(`   ❌ Falta: ${registro.falta ? 'Sim' : 'Não'}`);
        console.log(`   🕐 Batidas: ${registro.batidas.length} (${registro.batidas.map(b => b.horario).join(', ')})`);
      }
    }

    // 6. Estatísticas finais
    console.log('\n📈 ESTATÍSTICAS FINAIS:');
    console.log(`✅ Arquivo processado: ${resultado.arquivo ? 'Sim' : 'Não'}`);
    console.log(`✅ Registros extraídos: ${resultado.totalProcessados}`);
    console.log(`✅ Registros salvos no banco: ${novosRegistros.length}`);
    console.log(`✅ Taxa de sucesso: ${resultado.totalProcessados > 0 ? ((novosRegistros.length / resultado.totalProcessados) * 100).toFixed(1) : 0}%`);

    if (resultado.totalProcessados > 0 && novosRegistros.length === resultado.totalProcessados) {
      console.log('\n🎉 SUCESSO! Todos os registros foram processados e salvos corretamente!');
    } else if (novosRegistros.length > 0) {
      console.log('\n⚠️ PARCIAL: Alguns registros foram processados com sucesso');
    } else {
      console.log('\n❌ FALHA: Nenhum registro foi salvo no banco de dados');
    }

  } catch (error) {
    console.error('\n💥 ERRO DURANTE O TESTE:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 TESTE CONCLUÍDO');
}

// Executar o teste
testarUploadControllerLimpo(); 