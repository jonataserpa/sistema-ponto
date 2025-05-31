const linha = "08:00-----ALESSANDRO ROBERTO GARCIA7791";

console.log("=== TESTE ESPECÍFICO DO REGEX ===");
console.log("Linha para testar:", linha);
console.log("Tamanho:", linha.length);

// Teste 1: Regex atual
const regex1 = /([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ\s]+?)(\d{3,6})$/;
console.log("\n1. Regex atual:", regex1);
const match1 = linha.match(regex1);
console.log("Match:", match1);

// Teste 2: Regex mais simples
const regex2 = /(.+?)(\d{3,6})$/;
console.log("\n2. Regex simples:", regex2);
const match2 = linha.match(regex2);
console.log("Match:", match2);

// Teste 3: Análise caractere por caractere do nome
console.log("\n3. Análise do nome 'ALESSANDRO ROBERTO GARCIA':");
const nome = "ALESSANDRO ROBERTO GARCIA";
for (let i = 0; i < nome.length; i++) {
    const char = nome[i];
    const code = char.charCodeAt(0);
    console.log(`'${char}' (${code}) - ${char === ' ' ? 'ESPAÇO' : 'LETRA'}`);
}

// Teste 4: Verificar se há caracteres especiais invisíveis
console.log("\n4. Verificação de caracteres especiais:");
for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    const code = char.charCodeAt(0);
    if (code > 127 || code < 32) {
        console.log(`Posição ${i}: '${char}' (código ${code}) - ESPECIAL`);
    }
}

// Teste 5: Tentar diferentes abordagens
console.log("\n5. Diferentes abordagens:");

// Abordagem A: Buscar números no final
const numeros = linha.match(/(\d+)$/);
console.log("Números no final:", numeros);

if (numeros) {
    const matricula = numeros[1];
    const resto = linha.substring(0, linha.length - matricula.length);
    console.log("Matrícula:", matricula);
    console.log("Resto:", resto);
    
    // Limpar o resto para extrair o nome
    const nomeLimpo = resto.replace(/^[^A-Z]*/, '').replace(/[^A-Z\s]*$/, '').trim();
    console.log("Nome limpo:", nomeLimpo);
}

// Teste 6: Regex com caracteres Unicode
const regex6 = /([A-ZÀ-ÿ\s]+?)(\d{3,6})$/;
console.log("\n6. Regex com Unicode:", regex6);
const match6 = linha.match(regex6);
console.log("Match:", match6); 