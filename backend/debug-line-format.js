const linha = "07:00 - 12:00 - 13:00 - 16:00 - 06:36 - 16:2605/05/2508:00-01:50---ALESSANDRO ROBERTO GARCIA7791";

console.log("=== ANÁLISE DETALHADA DA LINHA ===");
console.log(`Linha: "${linha}"`);
console.log(`Tamanho: ${linha.length}`);

// 1. Encontrar a data
const regexData = /(\d{2}\/\d{2}\/\d{2})/;
const matchData = linha.match(regexData);
if (matchData) {
    const data = matchData[1];
    const posicaoData = linha.indexOf(data);
    console.log(`\n1. DATA ENCONTRADA:`);
    console.log(`   Data: "${data}"`);
    console.log(`   Posição: ${posicaoData}`);
    
    // 2. Analisar o que vem depois da data
    const parteAposData = linha.substring(posicaoData + data.length);
    console.log(`\n2. PARTE APÓS A DATA:`);
    console.log(`   Texto: "${parteAposData}"`);
    console.log(`   Tamanho: ${parteAposData.length}`);
    
    // 3. Tentar diferentes estratégias para extrair nome e matrícula
    console.log(`\n3. TESTANDO ESTRATÉGIAS DE EXTRAÇÃO:`);
    
    // Estratégia 1: Buscar números no final
    const regexNumerosFinal = /(\d{3,6})$/;
    const matchNumeros = parteAposData.match(regexNumerosFinal);
    if (matchNumeros) {
        const matricula = matchNumeros[1];
        const posicaoMatricula = parteAposData.lastIndexOf(matricula);
        const textoAntesMatricula = parteAposData.substring(0, posicaoMatricula);
        
        console.log(`   Estratégia 1 - Números no final:`);
        console.log(`     Matrícula: "${matricula}"`);
        console.log(`     Texto antes da matrícula: "${textoAntesMatricula}"`);
        
        // Tentar extrair o nome do texto antes da matrícula
        // Remover caracteres especiais e horários
        let textoLimpo = textoAntesMatricula;
        textoLimpo = textoLimpo.replace(/\d{2}:\d{2}/g, ''); // Remove horários
        textoLimpo = textoLimpo.replace(/[-:]/g, ''); // Remove traços e dois pontos
        textoLimpo = textoLimpo.trim();
        
        console.log(`     Nome extraído: "${textoLimpo}"`);
    }
    
    // Estratégia 2: Buscar padrão nome + números
    const regexNomeMatricula = /([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ\s]+?)(\d{3,6})$/;
    const matchNomeMatricula = parteAposData.match(regexNomeMatricula);
    if (matchNomeMatricula) {
        console.log(`   Estratégia 2 - Nome + Matrícula:`);
        console.log(`     Nome: "${matchNomeMatricula[1].trim()}"`);
        console.log(`     Matrícula: "${matchNomeMatricula[2]}"`);
    }
    
    // Estratégia 3: Analisar caractere por caractere para encontrar onde começa o nome
    console.log(`\n4. ANÁLISE CARACTERE POR CARACTERE:`);
    let inicioNome = -1;
    for (let i = 0; i < parteAposData.length; i++) {
        const char = parteAposData[i];
        if (/[A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ]/.test(char)) {
            inicioNome = i;
            break;
        }
    }
    
    if (inicioNome >= 0) {
        const textoDoNome = parteAposData.substring(inicioNome);
        console.log(`   Início do nome na posição: ${inicioNome}`);
        console.log(`   Texto do nome em diante: "${textoDoNome}"`);
        
        // Extrair nome e matrícula desta parte
        const matchFinal = textoDoNome.match(/([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ\s]+?)(\d{3,6})$/);
        if (matchFinal) {
            console.log(`   Nome final: "${matchFinal[1].trim()}"`);
            console.log(`   Matrícula final: "${matchFinal[2]}"`);
        }
    }
} 