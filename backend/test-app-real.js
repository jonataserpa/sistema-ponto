// Teste usando a aplicação real - método direto
const fs = require('fs').promises;
const path = require('path');

// Texto real extraído do PDF (baseado nos arquivos anexados)
const textoRealPdf = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   1032     MARIA APARECIDA ALVES DE MELO                                   Segunda                    -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25  12005     DARLAN VICTOR DE CASTRO E LOPES 07:00 - 12:00 - 13:00 - 16:00   07:06 - 11:57 - 12:58 - 15:59  -      -     -     -     -     -     08:00`;

async function testarAplicacaoReal() {
  try {
    console.log('=== TESTE COM APLICAÇÃO REAL - MÉTODO DIRETO ===\n');
    
    // Importar o pdfService real
    const pdfService = require('./dist/service/pdfService').default;
    console.log('✓ PdfService importado com sucesso');
    
    console.log('\n1. TESTANDO MÉTODO extrairRegistrosDeTexto DIRETAMENTE...\n');
    
    // Acessar o método privado usando reflexão
    const prototype = Object.getPrototypeOf(pdfService);
    const extrairRegistrosDeTexto = prototype.extrairRegistrosDeTexto;
    
    if (!extrairRegistrosDeTexto) {
      console.error('❌ Método extrairRegistrosDeTexto não encontrado');
      return;
    }
    
    console.log('✓ Método extrairRegistrosDeTexto encontrado');
    console.log(`✓ Texto para processar tem ${textoRealPdf.length} caracteres`);
    
    // Executar o método diretamente
    console.log('\n2. EXECUTANDO EXTRAÇÃO...\n');
    const registros = await extrairRegistrosDeTexto.call(pdfService, textoRealPdf);
    
    console.log('\n3. RESULTADO DA EXTRAÇÃO:');
    console.log(`   - Total de registros extraídos: ${registros.length}`);
    
    if (registros.length === 0) {
      console.log('   ❌ NENHUM REGISTRO FOI EXTRAÍDO!');
    } else {
      console.log('\n   ✓ REGISTROS EXTRAÍDOS COM SUCESSO:');
      registros.forEach((registro, index) => {
        console.log(`\n   Registro ${index + 1}:`);
        console.log(`     - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
        console.log(`     - É Falta: ${registro.falta}`);
        console.log(`     - Batidas: ${registro.batidas.length}`);
        
        if (registro.batidas.length > 0) {
          registro.batidas.forEach((batida, i) => {
            const horario = batida.horario.toTimeString().substring(0, 5);
            console.log(`       ${i + 1}. ${horario} (${batida.tipo})`);
          });
        }
      });
    }
    
    // Verificar dados no banco de dados
    console.log('\n4. VERIFICANDO DADOS NO BANCO...');
    
    const colaboradorRepository = require('./dist/repository/colaboradorRepository').default;
    const registroRepository = require('./dist/repository/registroRepository').default;
    
    // Verificar colaboradores específicos
    const colaboradoresParaVerificar = [
      { nome: 'ANA LUCIA', matricula: '886' },
      { nome: 'ELISA ESTER', matricula: '6861' },
      { nome: 'DARLAN VICTOR', matricula: '12005' },
      { nome: 'MARIA APARECIDA', matricula: '1032' }
    ];
    
    for (const colabInfo of colaboradoresParaVerificar) {
      const colaborador = await colaboradorRepository.findByMatricula(colabInfo.matricula);
      
      if (colaborador) {
        console.log(`\n   ✓ ${colabInfo.nome} encontrado: ID ${colaborador.id}, Nome: ${colaborador.nome}`);
        
        // Verificar registro para 05/05/2025
        const registro = await registroRepository.findByDataColaborador(new Date('2025-05-05'), colaborador.id);
        
        if (registro) {
          console.log(`     ✓ Registro encontrado:`);
          console.log(`       - Data: ${registro.data.toISOString().split('T')[0]}`);
          console.log(`       - Falta: ${registro.falta}`);
          console.log(`       - Batidas: ${registro.batidas.length}`);
          
          if (registro.batidas.length > 0) {
            registro.batidas.forEach((batida, i) => {
              const horario = batida.horario.toTimeString().substring(0, 5);
              console.log(`         ${i + 1}. ${horario} (${batida.tipo})`);
            });
          }
        } else {
          console.log(`     ❌ Nenhum registro encontrado para 05/05/2025`);
        }
      } else {
        console.log(`\n   ❌ ${colabInfo.nome} (${colabInfo.matricula}) não encontrado no banco`);
      }
    }
    
    // Contar total de colaboradores no banco
    console.log('\n5. ESTATÍSTICAS GERAIS:');
    
    const todosColaboradores = await colaboradorRepository.findAll();
    console.log(`   - Total de colaboradores no banco: ${todosColaboradores.length}`);
    
    // Verificar se há registros para a data específica
    try {
      const registrosHoje = await registroRepository.findByDataColaborador(new Date('2025-05-05'), 2); // ANA LUCIA
      console.log(`   - Exemplo de busca por registro específico: ${registrosHoje ? 'encontrado' : 'não encontrado'}`);
    } catch (error) {
      console.log(`   - Erro ao buscar registros: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarAplicacaoReal().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
}); 