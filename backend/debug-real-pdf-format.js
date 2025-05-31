// Debug do formato real do PDF
const sampleRealText = `08:50 - 10:00 - 11:00 - 17:50 - 08:59 - 10:00 - 10:59 - 17:5905/05/2508:00-----APARECIDA MARCILEI PEREIRA DE ANDRADE11437
07:00 - 11:20 - 12:10 - 16:30 - 06:52 - 11:21 - 12:05 - 16:2005/05/2508:40-----JOSSEANE LAURIANO BORGES11445
Segunda05/05/25-----08:00CIBELE GONZALES LOPES11669
06:00 - 18:00Falta05/05/25-----12:00VINICIUS DOS REIS1420`;

console.log('=== ANÁLISE DO FORMATO REAL DO PDF ===\n');

function analisarLinhaReal(linha) {
  console.log(`\nAnalisando: "${linha}"`);
  console.log(`Tamanho: ${linha.length}`);
  
  // O formato parece ser:
  // [JORNADA_ESPERADA] - [PONTO_REAL][DATA][OBSERVACOES][NOME][MATRICULA]
  
  // 1. Procurar pela data no formato dd/mm/aa
  const regexData = /(\d{2}\/\d{2}\/\d{2})/;
  const matchData = linha.match(regexData);
  
  if (!matchData) {
    console.log('  ❌ Sem data');
    return null;
  }
  
  const data = matchData[1];
  const posicaoData = linha.indexOf(data);
  console.log(`  ✅ Data: "${data}" na posição ${posicaoData}`);
  
  // 2. A matrícula está no FINAL da linha
  const regexMatriculaFinal = /(\d{3,6})$/;
  const matchMatricula = linha.match(regexMatriculaFinal);
  
  if (!matchMatricula) {
    console.log('  ❌ Sem matrícula no final');
    return null;
  }
  
  const matricula = matchMatricula[1];
  console.log(`  ✅ Matrícula: "${matricula}"`);
  
  // 3. O nome está entre a data+observações e a matrícula
  const parteAposData = linha.substring(posicaoData + data.length);
  const posicaoMatricula = parteAposData.lastIndexOf(matricula);
  const parteNome = parteAposData.substring(0, posicaoMatricula);
  
  console.log(`  📝 Parte do nome: "${parteNome}"`);
  
  // 4. Extrair nome (remover observações como -----, 08:00, etc.)
  let nome = parteNome;
  
  // Remover padrões de observações
  nome = nome.replace(/^[:\-\s\d]+/, ''); // Remove início com números, traços, dois pontos
  nome = nome.replace(/[:\-\s\d]+$/, ''); // Remove final com números, traços, dois pontos
  nome = nome.trim();
  
  console.log(`  ✅ Nome extraído: "${nome}"`);
  
  // 5. A parte antes da data contém jornada esperada e ponto real
  const parteAntesData = linha.substring(0, posicaoData);
  console.log(`  📝 Antes da data: "${parteAntesData}"`);
  
  // Dividir em jornada esperada e ponto real
  // Procurar por padrões de 4 horários (jornada completa)
  const regexJornadaCompleta = /(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g;
  const jornadas = parteAntesData.match(regexJornadaCompleta) || [];
  
  let jornadaEsperada = '';
  let pontoReal = '';
  
  if (jornadas.length >= 2) {
    jornadaEsperada = jornadas[0];
    pontoReal = jornadas[1];
  } else if (jornadas.length === 1) {
    jornadaEsperada = jornadas[0];
    // Procurar por horários individuais após a jornada
    const aposJornada = parteAntesData.substring(parteAntesData.indexOf(jornadaEsperada) + jornadaEsperada.length);
    const horariosIndividuais = aposJornada.match(/\d{2}:\d{2}/g) || [];
    if (horariosIndividuais.length > 0) {
      pontoReal = horariosIndividuais.join(' - ');
    }
  } else {
    // Sem jornada, pode ser falta ou status especial
    // Procurar por palavras como "Segunda", "Falta", etc.
    const regexStatus = /\b(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo|Falta|Folga)\b/i;
    const matchStatus = parteAntesData.match(regexStatus);
    if (matchStatus) {
      pontoReal = matchStatus[1];
    }
  }
  
  console.log(`  ✅ Jornada esperada: "${jornadaEsperada}"`);
  console.log(`  ✅ Ponto real: "${pontoReal}"`);
  
  // 6. Extrair horários do ponto real
  const horariosReais = pontoReal.match(/\d{2}:\d{2}/g) || [];
  console.log(`  ✅ Horários reais: [${horariosReais.join(', ')}]`);
  
  // 7. Determinar se é falta
  const isFalta = horariosReais.length === 0 || 
                 /\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo|folga)\b/i.test(pontoReal);
  
  console.log(`  ✅ É falta: ${isFalta}`);
  
  return {
    data,
    matricula,
    nome,
    jornadaEsperada,
    pontoReal,
    horariosReais,
    isFalta
  };
}

// Testar com as linhas de exemplo
const linhas = sampleRealText.split('\n');

console.log(`Total de linhas para testar: ${linhas.length}`);

const resultados = [];

linhas.forEach((linha, index) => {
  if (linha.trim()) {
    console.log(`\n=== LINHA ${index + 1} ===`);
    const resultado = analisarLinhaReal(linha.trim());
    if (resultado) {
      resultados.push(resultado);
    }
  }
});

console.log(`\n=== RESUMO DOS RESULTADOS ===`);
console.log(`Linhas processadas com sucesso: ${resultados.length}`);

resultados.forEach((resultado, index) => {
  console.log(`\n${index + 1}. ${resultado.nome} (${resultado.matricula})`);
  console.log(`   Data: ${resultado.data}`);
  console.log(`   Horários: [${resultado.horariosReais.join(', ')}]`);
  console.log(`   Falta: ${resultado.isFalta}`);
}); 