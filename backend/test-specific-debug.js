// Teste específico para debugar a função tentarExtrairDadosLinha

const linhaReal = "07:00 - 12:00 - 13:00 - 16:00 - 06:36 - 16:2605/05/2508:00-01:50---ALESSANDRO ROBERTO GARCIA7791";

console.log('=== DEBUG ESPECÍFICO DA FUNÇÃO tentarExtrairDadosLinha ===\n');

function tentarExtrairDadosLinha(linha) {
  console.log('\n=== PROCESSANDO LINHA ===');
  console.log(`Linha original: "${linha}"`);
  console.log(`Tamanho da linha: ${linha.length}`);

  // 1. Buscar data no formato dd/mm/aa
  const regexData = /(\d{2}\/\d{2}\/\d{2})/;
  const matchData = linha.match(regexData);
  
  if (!matchData) {
    console.log('❌ Nenhuma data encontrada no formato dd/mm/aa');
    return null;
  }

  const data = matchData[1];
  const posicaoData = linha.indexOf(data);
  console.log(`✅ Data encontrada: "${data}"`);
  console.log(`📍 Posição da data na linha: ${posicaoData}`);

  // 2. Extrair a parte após a data para buscar nome e matrícula
  const parteAposData = linha.substring(posicaoData + data.length);
  console.log(`📝 Parte após a data: "${parteAposData}"`);
  console.log(`📏 Tamanho da parte após data: ${parteAposData.length}`);
  
  // 3. Extrair nome e matrícula da parte após a data
  const regexNomeMatricula = /([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ\s]+?)(\d{3,6})$/;
  console.log(`🔍 Regex usado: ${regexNomeMatricula}`);
  
  const matchNomeMatricula = parteAposData.match(regexNomeMatricula);
  console.log(`🎯 Match resultado:`, matchNomeMatricula);
  
  if (!matchNomeMatricula) {
    console.log(`❌ Não foi possível extrair nome e matrícula da parte após data`);
    
    // Debug adicional - vamos testar outros regex
    console.log('\n🔧 TENTATIVAS DE DEBUG:');
    
    // Teste 1: Regex mais simples
    const regexSimples = /(.+?)(\d{3,6})$/;
    const matchSimples = parteAposData.match(regexSimples);
    console.log(`Teste 1 - Regex simples /(.+?)(\\d{3,6})$/: `, matchSimples);
    
    // Teste 2: Procurar apenas números no final
    const regexNumeros = /(\d{3,6})$/;
    const matchNumeros = parteAposData.match(regexNumeros);
    console.log(`Teste 2 - Apenas números /(\d{3,6})$/: `, matchNumeros);
    
    // Teste 3: Analisar caractere por caractere
    console.log('\n📊 Análise caractere por caractere dos últimos 20 caracteres:');
    const ultimos20 = parteAposData.slice(-20);
    for (let i = 0; i < ultimos20.length; i++) {
      const char = ultimos20[i];
      const code = char.charCodeAt(0);
      console.log(`  ${i}: "${char}" (${code}) - ${code >= 65 && code <= 90 ? 'MAIÚSCULA' : code >= 97 && code <= 122 ? 'minúscula' : code >= 48 && code <= 57 ? 'NÚMERO' : code === 32 ? 'ESPAÇO' : 'OUTRO'}`);
    }
    
    return null;
  }

  const nomeCompleto = matchNomeMatricula[1].trim();
  const matricula = matchNomeMatricula[2];
  
  console.log(`✅ Matrícula encontrada: "${matricula}"`);
  console.log(`✅ Nome encontrado: "${nomeCompleto}"`);

  // 4. Validar dados mínimos
  if (nomeCompleto.length < 3) {
    console.log(`❌ Nome muito curto: "${nomeCompleto}"`);
    return null;
  }

  if (matricula.length < 3) {
    console.log(`❌ Matrícula muito curta: "${matricula}"`);
    return null;
  }

  // 5. Extrair jornada (horários antes da data)
  const parteAntesData = linha.substring(0, posicaoData);
  console.log(`📝 Parte antes da data: "${parteAntesData}"`);
  
  let jornada = '';
  
  // Buscar padrões de horário na parte antes da data
  const regexHorarios = /(\d{2}:\d{2})/g;
  const horarios = parteAntesData.match(regexHorarios) || [];
  console.log(`⏰ Horários encontrados na jornada: [${horarios.join(', ')}]`);
  
  if (horarios.length >= 4) {
    jornada = `${horarios[0]} - ${horarios[1]} - ${horarios[2]} - ${horarios[3]}`;
  } else if (horarios.length >= 2) {
    jornada = `${horarios[0]} - ${horarios[1]}`;
  }

  // 6. Extrair ponto (parte entre data e nome)
  const inicioNome = parteAposData.search(/[A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ]/);
  console.log(`📍 Início do nome na parte após data: ${inicioNome}`);
  
  let ponto = '';
  
  if (inicioNome > 0) {
    ponto = parteAposData.substring(0, inicioNome).trim();
    console.log(`📝 Ponto bruto: "${ponto}"`);
    // Limpar caracteres especiais do ponto
    ponto = ponto.replace(/^[-\s]+/, '').replace(/[-\s]+$/, '');
    console.log(`📝 Ponto limpo: "${ponto}"`);
  }

  // 7. Verificar se é falta
  const isFalta = linha.includes('Falta') || ponto.includes('-----');

  // 8. Extrair observações
  let observacoes = '';
  if (linha.includes('Falta')) {
    observacoes = 'Falta';
  } else if (linha.includes('Folga')) {
    observacoes = 'Folga';
  } else if (linha.includes('Segunda')) {
    observacoes = 'Segunda-feira';
  }

  const resultado = {
    data,
    matricula,
    nome: nomeCompleto,
    jornada: jornada || 'Não informado',
    ponto: ponto || (isFalta ? 'Falta' : ''),
    observacoes,
    linha: linha.trim()
  };

  console.log('✅ Dados extraídos com sucesso:', resultado);
  return resultado;
}

// Testar com a linha real
console.log('Testando com linha real do PDF:');
const resultado = tentarExtrairDadosLinha(linhaReal);

if (resultado) {
  console.log('\n🎉 SUCESSO! Dados extraídos:');
  console.log(`  Data: ${resultado.data}`);
  console.log(`  Matrícula: ${resultado.matricula}`);
  console.log(`  Nome: ${resultado.nome}`);
  console.log(`  Jornada: ${resultado.jornada}`);
  console.log(`  Ponto: ${resultado.ponto}`);
} else {
  console.log('\n❌ FALHA na extração de dados');
} 