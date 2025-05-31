// Teste específico para debugar a linha da LAVINIA
const linhaLavinia = "05/05/25  11667     LAVINIA APARECIDA DA SILVA BERNARDES  09:00 - 12:00 - 13:00 - 18:00    08:55 - 12:00 - 12:38 - 18:03    -      -     -     -     -     -     08:00";

console.log('=== DEBUG ESPECÍFICO DA LAVINIA ===\n');

function tentarExtrairDadosLinha(linha) {
  console.log(`Linha original: "${linha}"`);
  console.log(`Tamanho da linha: ${linha.length}`);

  // 1. Buscar data no formato dd/mm/aa
  const regexData = /(\d{2}\/\d{2}\/\d{2})/;
  const matchData = linha.match(regexData);
  
  if (!matchData) {
    console.log('❌ Nenhuma data encontrada');
    return null;
  }

  const data = matchData[1];
  const posicaoData = linha.indexOf(data);
  console.log(`✅ Data encontrada: "${data}" na posição ${posicaoData}`);

  // 2. Extrair a parte após a data
  const parteAposData = linha.substring(posicaoData + data.length);
  console.log(`📝 Parte após a data: "${parteAposData}"`);
  
  // 3. NOVA ABORDAGEM: Extrair matrícula logo após a data
  const regexMatriculaAposData = /^\s+(\d{3,6})/;
  const matchMatricula = parteAposData.match(regexMatriculaAposData);
  
  if (!matchMatricula) {
    console.log(`❌ Não foi possível extrair matrícula após a data`);
    return null;
  }
  
  const matricula = matchMatricula[1];
  console.log(`✅ Matrícula: "${matricula}"`);
  
  // 4. Extrair nome após a matrícula
  const posicaoMatricula = parteAposData.indexOf(matricula);
  const parteAposMatricula = parteAposData.substring(posicaoMatricula + matricula.length);
  console.log(`📝 Parte após matrícula: "${parteAposMatricula}"`);
  
  // Dividir por espaços múltiplos para identificar as colunas
  const colunas = parteAposMatricula.split(/\s{2,}/);
  console.log('Colunas identificadas:');
  colunas.forEach((coluna, index) => {
    console.log(`  Coluna ${index}: "${coluna}"`);
  });
  
  // A primeira coluna deve ser o nome
  const nome = colunas[0] ? colunas[0].trim() : '';
  console.log(`✅ Nome extraído: "${nome}"`);
  
  // Se o nome está vazio, pegar da coluna 1
  let nomeCorreto = nome;
  if (!nomeCorreto && colunas[1]) {
    nomeCorreto = colunas[1].trim();
    console.log(`✅ Nome corrigido (coluna 1): "${nomeCorreto}"`);
  }
  
  // 5. Procurar por jornadas (padrão de 4 horários)
  const regexJornadaCompleta = /(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g;
  const todasJornadas = parteAposMatricula.match(regexJornadaCompleta) || [];
  
  console.log(`\nJornadas encontradas: ${todasJornadas.length}`);
  todasJornadas.forEach((jorn, index) => {
    console.log(`  Jornada ${index + 1}: "${jorn}"`);
  });
  
  let jornada = '';
  let ponto = '';
  
  // A primeira deve ser a jornada esperada, a segunda deve ser o ponto real
  if (todasJornadas.length >= 2) {
    jornada = todasJornadas[0];
    ponto = todasJornadas[1];
    console.log(`\n✅ Jornada: "${jornada}"`);
    console.log(`✅ Ponto: "${ponto}"`);
  } else if (todasJornadas.length === 1) {
    // Se só tem uma, assumir que é a jornada e procurar horários individuais
    jornada = todasJornadas[0];
    
    // Procurar por horários individuais após a jornada
    const posicaoJornada = parteAposMatricula.indexOf(jornada);
    const aposJornada = parteAposMatricula.substring(posicaoJornada + jornada.length);
    
    console.log(`\nApós a jornada: "${aposJornada}"`);
    
    // Procurar por horários individuais
    const regexHorarios = /\d{2}:\d{2}/g;
    const horariosIndividuais = aposJornada.match(regexHorarios) || [];
    
    if (horariosIndividuais.length > 0) {
      ponto = horariosIndividuais.join(' - ');
      console.log(`✅ Ponto (horários individuais): "${ponto}"`);
    }
  }
  
  return {
    data,
    matricula,
    nome: nomeCorreto,
    jornada,
    ponto,
    observacoes: ''
  };
}

function extrairBatidasDaLinha(pontoStr) {
  console.log(`\n=== EXTRAINDO BATIDAS ===`);
  console.log(`Ponto string: "${pontoStr}"`);
  
  if (!pontoStr) {
    console.log('String vazia, retornando array vazio');
    return [];
  }
  
  // Verificar se contém palavras que indicam falta ou ausência
  const palavrasFalta = ['falta', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const contemFalta = palavrasFalta.some(palavra => 
    pontoStr.toLowerCase().includes(palavra.toLowerCase())
  );
  
  if (contemFalta) {
    console.log('Contém palavra de falta, retornando array vazio');
    return [];
  }
  
  // Regex para extrair horários no formato HH:MM
  const regexHorarios = /\d{2}:\d{2}/g;
  const horarios = pontoStr.match(regexHorarios) || [];
  
  console.log(`Horários extraídos: [${horarios.join(', ')}]`);
  console.log(`Total de horários: ${horarios.length}`);
  
  return horarios;
}

// Executar o teste
const dadosExtraidos = tentarExtrairDadosLinha(linhaLavinia);

if (dadosExtraidos) {
  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Nome: ${dadosExtraidos.nome}`);
  console.log(`Matrícula: ${dadosExtraidos.matricula}`);
  console.log(`Data: ${dadosExtraidos.data}`);
  console.log(`Jornada: ${dadosExtraidos.jornada}`);
  console.log(`Ponto: ${dadosExtraidos.ponto}`);
  
  const batidas = extrairBatidasDaLinha(dadosExtraidos.ponto);
  console.log(`\nBatidas extraídas: [${batidas.join(', ')}]`);
  console.log(`Total de batidas: ${batidas.length}`);
  
  // Verificar se está correto
  const batidasEsperadas = ['08:55', '12:00', '12:38', '18:03'];
  console.log(`\nBatidas esperadas: [${batidasEsperadas.join(', ')}]`);
  console.log(`Batidas encontradas: [${batidas.join(', ')}]`);
  console.log(`Correto: ${JSON.stringify(batidas) === JSON.stringify(batidasEsperadas)}`);
} else {
  console.log('\n❌ Falha na extração dos dados');
} 