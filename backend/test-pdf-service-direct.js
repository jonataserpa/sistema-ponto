// Teste direto do método extrairRegistrosDeTexto
const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

async function testarExtracao() {
  try {
    console.log('=== TESTE DIRETO DO PDFSERVICE ===\n');
    
    // Importar a instância do pdfService
    const pdfService = require('./dist/service/pdfService').default;
    
    console.log('✓ PdfService importado');
    console.log('Tipo do pdfService:', typeof pdfService);
    
    // Usar reflexão para acessar o método privado
    console.log('\n1. Tentando acessar método privado extrairRegistrosDeTexto...');
    
    // Listar métodos disponíveis
    const prototype = Object.getPrototypeOf(pdfService);
    const methodNames = Object.getOwnPropertyNames(prototype);
    console.log('Métodos disponíveis:', methodNames.filter(name => typeof prototype[name] === 'function'));
    
    // Tentar acessar o método através do prototype
    const originalMethod = prototype.extrairRegistrosDeTexto;
    
    if (originalMethod) {
      console.log('✓ Método encontrado, executando...');
      
      const registros = await originalMethod.call(pdfService, sampleText);
      
      console.log('\n2. Resultado da extração:');
      console.log(`   - Total de registros: ${registros.length}`);
      
      registros.forEach((registro, index) => {
        console.log(`\n   Registro ${index + 1}:`);
        console.log(`     - Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
        console.log(`     - Data: ${registro.data.toISOString().split('T')[0]}`);
        console.log(`     - Falta: ${registro.falta}`);
        console.log(`     - Batidas: ${registro.batidas.length}`);
        registro.batidas.forEach((batida, i) => {
          console.log(`       ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
        });
      });
      
      // Verificar se os dados foram salvos no banco
      console.log('\n3. Verificando dados no banco...');
      
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
      
    } else {
      console.log('✗ Método extrairRegistrosDeTexto não encontrado');
      
      // Listar todos os métodos disponíveis
      console.log('\nMétodos disponíveis no prototype:');
      methodNames.forEach(name => {
        if (typeof prototype[name] === 'function') {
          console.log(`  - ${name}`);
        }
      });
    }
    
  } catch (error) {
    console.error('\n✗ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testarExtracao().then(() => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Erro fatal:', error);
  process.exit(1);
}); 