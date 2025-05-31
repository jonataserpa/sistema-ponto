const fs = require('fs');
const path = require('path');

async function testarUploadController() {
  console.log('=== TESTE UPLOAD CONTROLLER COM PDF REAL ===\n');
  
  try {
    console.log('1. IMPORTANDO SERVIÇOS...');
    const pdfService = require('./dist/service/pdfService').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    console.log('✓ Serviços importados\n');
    
    // Caminho do arquivo PDF real
    const pdfPath = './Relatorio Ponto para utilizar no sistema (1).pdf';
    
    console.log('2. VERIFICANDO ARQUIVO PDF...');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo PDF não encontrado: ${pdfPath}`);
    }
    
    const stats = fs.statSync(pdfPath);
    console.log(`✓ Arquivo encontrado: ${pdfPath}`);
    console.log(`✓ Tamanho: ${stats.size} bytes\n`);
    
    console.log('3. LIMPANDO REGISTROS EXISTENTES...');
    
    // Limpar registros de uma data específica para evitar conflitos
    const dataLimpeza = new Date('2024-01-01');
    const dataInicio = new Date(dataLimpeza);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataLimpeza);
    dataFim.setHours(23, 59, 59, 999);
    
    const registrosExistentes = await registroRepository.findAll({
      dataInicio,
      dataFim
    });
    
    console.log(`   Encontrados ${registrosExistentes.length} registros existentes`);
    
    for (const registro of registrosExistentes) {
      await registroRepository.delete(registro.id);
    }
    
    console.log(`✓ ${registrosExistentes.length} registros removidos\n`);
    
    console.log('4. PROCESSANDO PDF COM pdfService.processarEspelhoPonto...');
    
    // Processar o PDF usando o método principal
    const resultado = await pdfService.processarEspelhoPonto(pdfPath);
    
    console.log('✓ Processamento concluído');
    console.log(`   - Arquivo processado: ${resultado.arquivo.processado}`);
    console.log(`   - Nome: ${resultado.arquivo.nome}`);
    console.log(`   - Tamanho: ${resultado.arquivo.tamanho} bytes`);
    console.log(`   - Hash: ${resultado.arquivo.hash}`);
    console.log(`   - Total processados: ${resultado.totalProcessados}`);
    console.log(`   - Registros extraídos: ${resultado.registros.length}`);
    console.log(`   - Erros: ${resultado.erros.length}`);
    
    if (resultado.erros.length > 0) {
      console.log('\n   ERROS ENCONTRADOS:');
      resultado.erros.forEach((erro, index) => {
        console.log(`     ${index + 1}. ${erro}`);
      });
    }
    
    console.log('\n5. ANALISANDO REGISTROS EXTRAÍDOS...');
    
    if (resultado.registros.length === 0) {
      console.log('⚠️ NENHUM REGISTRO FOI EXTRAÍDO!');
      
      // Tentar extrair texto diretamente para debug
      console.log('\n   TENTANDO EXTRAIR TEXTO DIRETAMENTE...');
      try {
        const textoExtraido = await pdfService.extractTextFromPdf(pdfPath);
        console.log(`   Texto extraído: ${textoExtraido.length} caracteres`);
        console.log(`   Primeiros 500 caracteres:`);
        console.log(`   "${textoExtraido.substring(0, 500)}..."`);
        
        if (textoExtraido.length > 0) {
          console.log('\n   ✓ PDF contém texto, mas não foi processado corretamente');
          console.log('   Possíveis problemas:');
          console.log('   - Formato do texto não reconhecido');
          console.log('   - Regex de extração não compatível');
          console.log('   - Estrutura do PDF diferente do esperado');
        }
      } catch (textError) {
        console.log(`   ❌ Erro ao extrair texto: ${textError.message}`);
      }
    } else {
      console.log(`✓ ${resultado.registros.length} registros extraídos com sucesso`);
      
      // Mostrar detalhes dos primeiros registros
      const maxMostrar = Math.min(5, resultado.registros.length);
      console.log(`\n   DETALHES DOS PRIMEIROS ${maxMostrar} REGISTROS:`);
      
      for (let i = 0; i < maxMostrar; i++) {
        const registro = resultado.registros[i];
        console.log(`\n   ${i + 1}. ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`      Data: ${registro.data.toISOString().split('T')[0]}`);
        console.log(`      Falta: ${registro.falta}`);
        console.log(`      Batidas: ${registro.batidas.length}`);
        
        if (registro.batidas.length > 0) {
          registro.batidas.forEach((batida, index) => {
            const horario = batida.horario.toTimeString().substring(0, 5);
            console.log(`        ${index + 1}. ${horario} (${batida.tipo})`);
          });
        }
      }
    }
    
    console.log('\n6. VERIFICANDO DADOS NO BANCO...');
    
    // Verificar colaboradores criados
    const todosColaboradores = await colaboradorRepository.findAll();
    console.log(`   Total de colaboradores no banco: ${todosColaboradores.length}`);
    
    // Verificar registros criados
    const todosRegistros = await registroRepository.findAll();
    console.log(`   Total de registros no banco: ${todosRegistros.length}`);
    
    // Verificar registros recentes (últimas 24 horas)
    const agora = new Date();
    const ontemInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    ontemInicio.setHours(0, 0, 0, 0);
    const ontemFim = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    ontemFim.setHours(23, 59, 59, 999);
    
    const registrosRecentes = await registroRepository.findAll({
      dataInicio: ontemInicio,
      dataFim: agora
    });
    
    console.log(`   Registros criados nas últimas 24h: ${registrosRecentes.length}`);
    
    console.log('\n7. SIMULANDO UPLOAD CONTROLLER...');
    
    // Simular o que o uploadController faria
    const colaboradoresProcessados = new Set();
    let registrosSalvos = 0;
    
    if (resultado.registros.length > 0) {
      console.log('   Simulando salvamento de registros...');
      
      for (const registro of resultado.registros) {
        if (registro.colaborador && registro.colaborador.matricula) {
          colaboradoresProcessados.add(registro.colaborador.matricula);
          
          // Buscar colaborador
          const colaborador = await colaboradorRepository.findByMatricula(registro.colaborador.matricula);
          
          if (colaborador) {
            try {
              // Tentar salvar (pode falhar se já existir)
              await registroRepository.createOrUpdate(registro, colaborador.id);
              registrosSalvos++;
            } catch (error) {
              console.log(`     ⚠️ Erro ao salvar registro para ${registro.colaborador.matricula}: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log(`   Colaboradores processados: ${colaboradoresProcessados.size}`);
    console.log(`   Registros salvos: ${registrosSalvos}`);
    
    console.log('\n8. RESULTADO FINAL:');
    console.log(`   ✓ PDF processado: ${resultado.arquivo.processado}`);
    console.log(`   ✓ Registros extraídos: ${resultado.registros.length}`);
    console.log(`   ✓ Colaboradores únicos: ${colaboradoresProcessados.size}`);
    console.log(`   ✓ Registros salvos: ${registrosSalvos}`);
    console.log(`   ✓ Erros: ${resultado.erros.length}`);
    
    if (resultado.registros.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Nenhum registro foi extraído do PDF');
      console.log('   Possíveis causas:');
      console.log('   1. Formato do PDF não compatível com o parser');
      console.log('   2. Estrutura do texto diferente do esperado');
      console.log('   3. Regex de extração precisa ser ajustada');
      console.log('   4. PDF pode ser baseado em imagens (necessita OCR)');
    } else {
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarUploadController()
  .then(() => {
    console.log('\n=== FIM DO TESTE ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  }); 