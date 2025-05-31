// Teste End-to-End completo da aplicação
const fs = require('fs').promises;
const path = require('path');

// Texto de exemplo que simula um PDF real
const textoRealPdf = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   1032     MARIA APARECIDA ALVES DE MELO                                   Segunda                    -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25  12005     DARLAN VICTOR DE CASTRO E LOPES 07:00 - 12:00 - 13:00 - 16:00   07:06 - 11:57 - 12:58 - 15:59  -      -     -     -     -     -     08:00`;

async function testarE2ECompleto() {
  try {
    console.log('=== TESTE END-TO-END COMPLETO ===\n');
    
    // 1. SIMULAR UPLOAD DE ARQUIVO
    console.log('1. SIMULANDO UPLOAD DE ARQUIVO...');
    const tempFilePath = path.join(__dirname, 'temp-e2e-test.txt');
    await fs.writeFile(tempFilePath, textoRealPdf);
    console.log(`✓ Arquivo temporário criado: ${tempFilePath}`);
    console.log(`✓ Tamanho do arquivo: ${(await fs.stat(tempFilePath)).size} bytes`);
    
    // 2. IMPORTAR SERVIÇOS DA APLICAÇÃO
    console.log('\n2. IMPORTANDO SERVIÇOS DA APLICAÇÃO...');
    const pdfService = require('./dist/service/pdfService').default;
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    console.log('✓ PdfService importado');
    console.log('✓ ColaboradorRepository importado');
    console.log('✓ RegistroRepository importado');
    
    // 3. SIMULAR ROTA DE UPLOAD (uploadController.upload)
    console.log('\n3. SIMULANDO ROTA DE UPLOAD...');
    console.log('   Iniciando processamento do arquivo...');
    
    // Simular validação do arquivo
    const fileStats = await fs.stat(tempFilePath);
    console.log(`   ✓ Arquivo validado: ${fileStats.size} bytes`);
    
    // Chamar o pdfService.processarEspelhoPonto (como no controller)
    console.log('   Chamando pdfService.processarEspelhoPonto...');
    const resultadoProcessamento = await pdfService.processarEspelhoPonto(tempFilePath);
    
    console.log('\n4. RESULTADO DO PROCESSAMENTO:');
    console.log(`   - Arquivo processado: ${resultadoProcessamento.arquivo.processado}`);
    console.log(`   - Nome do arquivo: ${resultadoProcessamento.arquivo.nome}`);
    console.log(`   - Hash do arquivo: ${resultadoProcessamento.arquivo.hash}`);
    console.log(`   - Total de registros extraídos: ${resultadoProcessamento.totalProcessados}`);
    console.log(`   - Número de erros: ${resultadoProcessamento.erros.length}`);
    
    if (resultadoProcessamento.erros.length > 0) {
      console.log('   ERROS ENCONTRADOS:');
      resultadoProcessamento.erros.forEach((erro, index) => {
        console.log(`     ${index + 1}. ${erro}`);
      });
    }
    
    // 5. ANALISAR REGISTROS EXTRAÍDOS
    console.log('\n5. ANALISANDO REGISTROS EXTRAÍDOS:');
    
    if (resultadoProcessamento.registros.length === 0) {
      console.log('   ⚠️ NENHUM REGISTRO FOI EXTRAÍDO!');
      console.log('   Isso indica um problema na função extrairRegistrosDeTexto');
      
      // Tentar acessar diretamente o método para debug
      console.log('\n   TENTANDO DEBUG DIRETO...');
      const prototype = Object.getPrototypeOf(pdfService);
      const extrairMethod = prototype.extrairRegistrosDeTexto;
      
      if (extrairMethod) {
        console.log('   ✓ Método extrairRegistrosDeTexto encontrado');
        console.log('   Executando diretamente com o texto...');
        
        const registrosDiretos = await extrairMethod.call(pdfService, textoRealPdf);
        console.log(`   Resultado direto: ${registrosDiretos.length} registros`);
        
        registrosDiretos.forEach((registro, index) => {
          console.log(`     Registro ${index + 1}: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
          console.log(`       Data: ${registro.data.toISOString().split('T')[0]}`);
          console.log(`       Falta: ${registro.falta}`);
          console.log(`       Batidas: ${registro.batidas.length}`);
        });
      }
    } else {
      console.log(`   ✓ ${resultadoProcessamento.registros.length} registros extraídos com sucesso`);
      
      resultadoProcessamento.registros.forEach((registro, index) => {
        console.log(`\n   Registro ${index + 1}:`);
        console.log(`     - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
        console.log(`     - É Falta: ${registro.falta}`);
        console.log(`     - Batidas: ${registro.batidas.length}`);
        registro.batidas.forEach((batida, i) => {
          console.log(`       ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
        });
      });
    }
    
    // 6. SIMULAR SALVAMENTO DOS REGISTROS (uploadController.salvarRegistros)
    console.log('\n6. SIMULANDO SALVAMENTO DOS REGISTROS...');
    
    let registrosSalvos = 0;
    const colaboradoresProcessados = new Set();
    
    for (const registro of resultadoProcessamento.registros) {
      try {
        if (!registro.colaborador || !registro.colaborador.matricula) {
          console.log('   ⚠️ Registro sem colaborador válido, pulando...');
          continue;
        }
        
        const matricula = registro.colaborador.matricula;
        colaboradoresProcessados.add(matricula);
        
        console.log(`\n   --- Processando ${registro.colaborador.nome} (${matricula}) ---`);
        
        // Buscar colaborador no banco
        const colaborador = await colaboradorRepository.findByMatricula(matricula);
        
        if (colaborador) {
          console.log(`   ✓ Colaborador encontrado no banco: ID ${colaborador.id}`);
          
          // Verificar se já existe registro para esta data
          const dataRegistro = registro.data;
          const registroExistente = await registroRepository.findByDataColaborador(dataRegistro, colaborador.id);
          
          if (registroExistente) {
            console.log(`   ⚠️ Registro já existe para esta data`);
            console.log(`     Existente: Falta: ${registroExistente.falta}, Batidas: ${registroExistente.batidas.length}`);
            console.log(`     Novo: Falta: ${registro.falta}, Batidas: ${registro.batidas.length}`);
          }
          
          // Salvar/atualizar registro
          await registroRepository.createOrUpdate(registro, colaborador.id);
          registrosSalvos++;
          
          console.log(`   ✓ Registro salvo/atualizado com sucesso`);
          
          // Verificar se foi realmente salvo
          const registroVerificacao = await registroRepository.findByDataColaborador(dataRegistro, colaborador.id);
          if (registroVerificacao) {
            console.log(`   ✓ Verificação: Registro confirmado no banco`);
            console.log(`     - Falta: ${registroVerificacao.falta}`);
            console.log(`     - Batidas: ${registroVerificacao.batidas.length}`);
          } else {
            console.log(`   ✗ Erro: Registro não encontrado após salvamento`);
          }
        } else {
          console.log(`   ✗ Colaborador não encontrado no banco: ${matricula}`);
        }
      } catch (error) {
        console.error(`   ✗ Erro ao processar registro:`, error.message);
      }
    }
    
    // 7. VERIFICAÇÃO FINAL DOS DADOS
    console.log('\n7. VERIFICAÇÃO FINAL DOS DADOS NO BANCO...');
    
    const colaboradoresParaVerificar = [
      { matricula: '886', nome: 'ANA LUCIA' },
      { matricula: '1032', nome: 'MARIA APARECIDA' },
      { matricula: '6861', nome: 'ELISA ESTER' },
      { matricula: '12005', nome: 'DARLAN VICTOR' }
    ];
    
    for (const colabInfo of colaboradoresParaVerificar) {
      console.log(`\n   Verificando ${colabInfo.nome}:`);
      
      const colaborador = await colaboradorRepository.findByMatricula(colabInfo.matricula);
      if (colaborador) {
        console.log(`   ✓ Colaborador encontrado: ID ${colaborador.id}, Nome: ${colaborador.nome}`);
        
        const registro = await registroRepository.findByDataColaborador(new Date('2025-05-05'), colaborador.id);
        if (registro) {
          console.log(`     ✓ Registro encontrado:`);
          console.log(`       - Data: ${registro.data.toISOString().split('T')[0]}`);
          console.log(`       - Falta: ${registro.falta}`);
          console.log(`       - Batidas: ${registro.batidas.length}`);
          registro.batidas.forEach((batida, i) => {
            console.log(`         ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
          });
        } else {
          console.log(`     ✗ Nenhum registro encontrado para 05/05/2025`);
        }
      } else {
        console.log(`   ✗ Colaborador não encontrado no banco`);
      }
    }
    
    // 8. ESTATÍSTICAS FINAIS
    console.log('\n8. ESTATÍSTICAS FINAIS:');
    
    // Contar total de colaboradores no banco
    const todosColaboradores = await colaboradorRepository.findAll();
    console.log(`   - Total de colaboradores no banco: ${todosColaboradores.length}`);
    
    // Contar registros para a data específica usando findAll com filtros
    const dataEspecifica = new Date('2025-05-05');
    const dataInicio = new Date(dataEspecifica);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataEspecifica);
    dataFim.setHours(23, 59, 59, 999);
    
    const registrosData = await registroRepository.findAll({
      dataInicio: dataInicio,
      dataFim: dataFim
    });
    console.log(`   - Registros para 05/05/2025: ${registrosData.length}`);
    
    console.log(`   - Registros processados neste teste: ${registrosSalvos}`);
    console.log(`   - Colaboradores únicos processados: ${colaboradoresProcessados.size}`);
    
    // Limpar arquivo temporário
    await fs.unlink(tempFilePath);
    console.log('\n✓ Arquivo temporário removido');
    
    return {
      arquivoProcessado: resultadoProcessamento.arquivo.processado,
      registrosExtraidos: resultadoProcessamento.totalProcessados,
      registrosSalvos,
      colaboradoresProcessados: colaboradoresProcessados.size,
      erros: resultadoProcessamento.erros.length
    };
    
  } catch (error) {
    console.error('\n✗ ERRO DURANTE O TESTE E2E:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Executar o teste
testarE2ECompleto().then((resultado) => {
  console.log('\n=== TESTE E2E CONCLUÍDO ===');
  console.log(`✓ Arquivo processado: ${resultado.arquivoProcessado}`);
  console.log(`✓ Registros extraídos: ${resultado.registrosExtraidos}`);
  console.log(`✓ Registros salvos: ${resultado.registrosSalvos}`);
  console.log(`✓ Colaboradores processados: ${resultado.colaboradoresProcessados}`);
  console.log(`✓ Erros: ${resultado.erros}`);
  
  if (resultado.registrosExtraidos > 0 && resultado.registrosSalvos > 0) {
    console.log('\n🎉 TESTE E2E PASSOU COM SUCESSO!');
  } else {
    console.log('\n⚠️ TESTE E2E TEVE PROBLEMAS - Verifique os logs acima');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('\n💥 TESTE E2E FALHOU:', error.message);
  process.exit(1);
}); 