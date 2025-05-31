const linha = "07:00 - 12:00 - 13:00 - 16:00 - 06:36 - 16:2605/05/2508:00-01:50---ALESSANDRO ROBERTO GARCIA7791";

console.log('=== TESTE DE LINHA ESPECÍFICA ===');
console.log(`Linha: "${linha}"`);
console.log(`Tamanho: ${linha.length}`);

// Teste 1: Buscar data
const regexData = /(\d{2}\/\d{2}\/\d{2})/;
const matchData = linha.match(regexData);
console.log('\n1. TESTE DATA:');
console.log('Regex:', regexData);
console.log('Match:', matchData);
if (matchData) {
    console.log('Data encontrada:', matchData[1]);
    console.log('Posição:', linha.indexOf(matchData[1]));
}

// Teste 2: Buscar matrícula no final
const regexMatricula = /([A-ZÁÊÇÕ\s]+?)(\d{3,6})$/;
const matchMatricula = linha.match(regexMatricula);
console.log('\n2. TESTE MATRÍCULA:');
console.log('Regex:', regexMatricula);
console.log('Match:', matchMatricula);
if (matchMatricula) {
    console.log('Nome:', matchMatricula[1].trim());
    console.log('Matrícula:', matchMatricula[2]);
}

// Teste 3: Buscar matrícula com regex mais flexível
const regexMatricula2 = /([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑa-záêçõàâãéíóúüñ\s]+?)(\d{3,6})$/;
const matchMatricula2 = linha.match(regexMatricula2);
console.log('\n3. TESTE MATRÍCULA FLEXÍVEL:');
console.log('Regex:', regexMatricula2);
console.log('Match:', matchMatricula2);
if (matchMatricula2) {
    console.log('Nome:', matchMatricula2[1].trim());
    console.log('Matrícula:', matchMatricula2[2]);
}

// Teste 4: Analisar caracteres do nome
console.log('\n4. ANÁLISE DE CARACTERES:');
const nomeCompleto = "ALESSANDRO ROBERTO GARCIA";
for (let i = 0; i < nomeCompleto.length; i++) {
    const char = nomeCompleto[i];
    const code = char.charCodeAt(0);
    console.log(`"${char}" -> ${code} (${code >= 65 && code <= 90 ? 'A-Z' : code === 32 ? 'SPACE' : 'OTHER'})`);
}

// Teste 5: Regex mais simples
const regexSimples = /(.+?)(\d{3,6})$/;
const matchSimples = linha.match(regexSimples);
console.log('\n5. TESTE REGEX SIMPLES:');
console.log('Regex:', regexSimples);
console.log('Match:', matchSimples);
if (matchSimples) {
    console.log('Parte antes da matrícula:', matchSimples[1].trim());
    console.log('Matrícula:', matchSimples[2]);
} 