// Teste para verificar o fluxo completo do pdfService

const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

console.log('=== TESTE DO FLUXO COMPLETO ===\n');

// Simular o método tentarExtrairDadosLinha
function tentarExtrairDadosLinha(linha) {
  const matchData = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
  if (!matchData) {
    return null;
  }
  
  try {
    const data = linha.substring(0, 8).trim();
    const matriculaMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})\s+(\d{3,5})/);
    if (!matriculaMatch) {
      return null;
    }
    
    const matricula = matriculaMatch[2];
    const matriculaIndex = linha.indexOf(matricula);
    const nomeStart = matriculaIndex + matricula.length;
    
    let nomeEnd = linha.length;
    const patterns = [
      /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/,
      /\bFalta\b/i,
      /\bSegunda\b/i,
      /\bTerça\b/i,
      /\bQuarta\b/i,
      /\bQuinta\b/i,
      /\bSexta\b/i
    ];
    
    for (const pattern of patterns) {
      const match = linha.substring(nomeStart).search(pattern);
      if (match !== -1) {
        nomeEnd = nomeStart + match;
        break;
      }
    }
    
    const nome = linha.substring(nomeStart, nomeEnd).trim();
    const resto = linha.substring(nomeEnd).trim();
    
    let jornada = '';
    let ponto = '';
    
    const jornadaMatch = resto.match(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
    
    if (jornadaMatch) {
      jornada = jornadaMatch[1];
      const jornadaIndex = resto.indexOf(jornada);
      const pontoCompleto = resto.substring(jornadaIndex + jornada.length).trim();
      
      const pontoMatch = pontoCompleto.match(/^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*)/);
      if (pontoMatch) {
        ponto = pontoMatch[1].trim();
      } else {
        const palavraMatch = pontoCompleto.match(/^([A-Za-zÀ-ÚÇ]+)/);
        if (palavraMatch) {
          ponto = palavraMatch[1].trim();
        } else {
          const parts = pontoCompleto.split(/\s+-\s+/);
          ponto = parts[0].trim();
        }
      }
    } else {
      const pontoMatch = resto.match(/^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*)/);
      if (pontoMatch) {
        ponto = pontoMatch[1].trim();
      } else {
        const palavraMatch = resto.match(/^([A-Za-zÀ-ÚÇ]+)/);
        if (palavraMatch) {
          ponto = palavraMatch[1].trim();
        } else {
          const parts = resto.split(/\s+-\s+/);
          ponto = parts[0].trim();
        }
      }
    }
    
    return {
      data: data.replace(/\s+/g, ''),
      matricula,
      nome: nome.replace(/\s+/g, ' ').trim(),
      jornada,
      ponto,
      observacoes: ''
    };
  } catch (error) {
    console.error('Erro ao extrair dados da linha:', error);
    return null;
  }
}

// Simular o método extrairBatidasDaLinha
function extrairBatidasDaLinha(pontoStr) {
  console.log(`  extrairBatidasDaLinha("${pontoStr}")`);
  
  if (!pontoStr || pontoStr.toLowerCase().includes('falta') || pontoStr.toLowerCase().includes('segunda')) {
    console.log(`    Retornando [] (falta ou dia da semana)`);
    return [];
  }
  
  const regexHorarios = /\d{2}:\d{2}/g;
  const horarios = pontoStr.match(regexHorarios) || [];
  
  console.log(`    Horários extraídos: [${horarios.join(', ')}]`);
  
  return horarios;
}

// Simular o método determinarTipoJornada
function determinarTipoJornada(jornada) {
  if (!jornada || jornada.toLowerCase().includes('falta')) {
    return 'FALTA';
  }
  
  const horarios = jornada.match(/\d{2}:\d{2}/g) || [];
  
  if (horarios.length >= 4) {
    return 'COMPLETA';
  } else if (horarios.length >= 2) {
    return 'SIMPLES';
  }
  
  return 'FALTA';
}

// Simular o método getBatidasEsperadas
function getBatidasEsperadas(tipoJornada) {
  switch (tipoJornada) {
    case 'COMPLETA':
      return ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA'];
    case 'SIMPLES':
      return ['ENTRADA', 'SAIDA'];
    case 'FALTA':
    default:
      return [];
  }
}

// Processar as linhas
const linhas = sampleText.split('\n');
const dadosColaboradores = new Map();

console.log('1. EXTRAÇÃO DE DADOS DAS LINHAS:\n');

linhas.forEach((linha, index) => {
  if (linha.trim()) {
    const dadosExtraidos = tentarExtrairDadosLinha(linha);
    
    if (dadosExtraidos) {
      const { data: dataStr, matricula, nome, jornada, ponto, observacoes } = dadosExtraidos;
      
      console.log(`Linha ${index + 1}: ${linha}`);
      console.log(`  Data: "${dataStr}", Matrícula: "${matricula}", Nome: "${nome}"`);
      console.log(`  Jornada: "${jornada}", Ponto: "${ponto}"`);
      
      const chave = `${dataStr}_${matricula}`;
      
      if (nome.length > 3 && matricula.length >= 3) {
        const batidas = extrairBatidasDaLinha(ponto);
        
        dadosColaboradores.set(chave, {
          colaborador: { matricula, nome },
          jornada: jornada || '',
          batidas,
          observacoes: observacoes || ''
        });
        
        console.log(`  ✓ Adicionado ao mapa com chave: "${chave}"`);
      } else {
        console.log(`  ✗ Dados inválidos (nome: ${nome.length} chars, matrícula: ${matricula.length} chars)`);
      }
      console.log('');
    }
  }
});

console.log(`\n2. DADOS COLETADOS (${dadosColaboradores.size} registros):\n`);

for (const [chave, dados] of dadosColaboradores.entries()) {
  const { colaborador, jornada, batidas, observacoes } = dados;
  const [dataStr] = chave.split('_');
  
  console.log(`Chave: ${chave}`);
  console.log(`  Colaborador: ${colaborador.nome} (${colaborador.matricula})`);
  console.log(`  Data: ${dataStr}`);
  console.log(`  Jornada: "${jornada}"`);
  console.log(`  Batidas: [${batidas.join(', ')}]`);
  
  // Simular a lógica de criarRegistroPonto
  const isFalta = batidas.length === 0 || 
                 jornada.toLowerCase().includes('falta') ||
                 observacoes.toLowerCase().includes('falta');
  
  const tipoJornada = determinarTipoJornada(jornada);
  const batidasEsperadas = getBatidasEsperadas(tipoJornada);
  
  console.log(`  É falta: ${isFalta}`);
  console.log(`  Tipo jornada: ${tipoJornada}`);
  console.log(`  Batidas esperadas: [${batidasEsperadas.join(', ')}]`);
  
  // Simular criação das batidas
  const batidasProcessadas = [];
  for (let i = 0; i < batidas.length && i < batidasEsperadas.length; i++) {
    const horarioStr = batidas[i];
    const tipoBatida = batidasEsperadas[i];
    
    batidasProcessadas.push({
      horario: horarioStr,
      tipo: tipoBatida
    });
  }
  
  console.log(`  Batidas processadas: ${JSON.stringify(batidasProcessadas, null, 2)}`);
  console.log('');
}

console.log('\n3. VERIFICAÇÃO DOS CASOS ESPECÍFICOS:\n');

const anaLucia = Array.from(dadosColaboradores.values()).find(d => d.colaborador.nome.includes('ANA LUCIA'));
if (anaLucia) {
  console.log('✓ ANA LUCIA encontrada:');
  console.log(`  Matrícula: ${anaLucia.colaborador.matricula}`);
  console.log(`  Batidas: [${anaLucia.batidas.join(', ')}]`);
  console.log(`  É falta: ${anaLucia.batidas.length === 0}`);
} else {
  console.log('✗ ANA LUCIA não encontrada');
}

const elisaEster = Array.from(dadosColaboradores.values()).find(d => d.colaborador.nome.includes('ELISA ESTER'));
if (elisaEster) {
  console.log('\n✓ ELISA ESTER encontrada:');
  console.log(`  Matrícula: ${elisaEster.colaborador.matricula}`);
  console.log(`  Batidas: [${elisaEster.batidas.join(', ')}]`);
  console.log(`  É falta: ${elisaEster.batidas.length === 0}`);
} else {
  console.log('\n✗ ELISA ESTER não encontrada');
} 