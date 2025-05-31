const registroRepository = require('./dist/repository/registroRepository.js').default;

async function testarFindByDataColaborador() {
    console.log('🔍 TESTANDO MÉTODO findByDataColaborador');
    
    try {
        // Teste com uma data específica e colaborador
        const data = new Date('2025-05-05');
        data.setHours(0, 0, 0, 0);
        const colaboradorId = 1; // Assumindo que existe um colaborador com ID 1
        
        console.log(`Buscando registro para data: ${data.toISOString()} e colaboradorId: ${colaboradorId}`);
        
        const registro = await registroRepository.findByDataColaborador(data, colaboradorId);
        
        if (registro) {
            console.log('✅ Registro encontrado:');
            console.log(`   - ID: ${registro.id}`);
            console.log(`   - Data: ${registro.data}`);
            console.log(`   - ColaboradorId: ${registro.colaboradorId}`);
            console.log(`   - Colaborador: ${registro.colaborador?.nome}`);
            console.log(`   - Batidas: ${registro.batidas?.length || 0}`);
        } else {
            console.log('❌ Nenhum registro encontrado');
        }
        
        // Teste com vários colaboradores
        console.log('\n🔍 TESTANDO COM VÁRIOS COLABORADORES');
        for (let i = 1; i <= 5; i++) {
            const reg = await registroRepository.findByDataColaborador(data, i);
            console.log(`ColaboradorId ${i}: ${reg ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testarFindByDataColaborador(); 