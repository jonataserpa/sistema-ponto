const registroRepository = require('./dist/repository/registroRepository.js').default;

async function verificarDatasNoBanco() {
    console.log('🔍 VERIFICANDO DATAS NO BANCO DE DADOS');
    
    try {
        // Buscar todos os registros para ver as datas
        const registros = await registroRepository.findAll();
        
        console.log(`Total de registros no banco: ${registros.length}`);
        
        if (registros.length > 0) {
            console.log('\n📅 DATAS ENCONTRADAS:');
            
            // Agrupar por data
            const datasPorData = {};
            registros.forEach(registro => {
                const dataStr = registro.data.toISOString().split('T')[0];
                if (!datasPorData[dataStr]) {
                    datasPorData[dataStr] = 0;
                }
                datasPorData[dataStr]++;
            });
            
            Object.keys(datasPorData).sort().forEach(data => {
                console.log(`   ${data}: ${datasPorData[data]} registros`);
            });
            
            // Mostrar alguns registros de exemplo
            console.log('\n📋 EXEMPLOS DE REGISTROS:');
            registros.slice(0, 5).forEach((registro, index) => {
                console.log(`   ${index + 1}. Data: ${registro.data.toISOString()}, ColaboradorId: ${registro.colaboradorId}, Colaborador: ${registro.colaborador?.nome || 'N/A'}`);
            });
            
            // Testar busca com uma data que sabemos que existe
            const primeiraData = registros[0].data;
            const primeiroColaboradorId = registros[0].colaboradorId;
            
            console.log(`\n🔍 TESTANDO BUSCA COM DATA EXISTENTE:`);
            console.log(`   Data: ${primeiraData.toISOString()}`);
            console.log(`   ColaboradorId: ${primeiroColaboradorId}`);
            
            const registroEncontrado = await registroRepository.findByDataColaborador(primeiraData, primeiroColaboradorId);
            
            if (registroEncontrado) {
                console.log('✅ Registro encontrado com sucesso!');
            } else {
                console.log('❌ Registro não encontrado - há problema na busca');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

verificarDatasNoBanco(); 