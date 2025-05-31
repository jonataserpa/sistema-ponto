// Teste específico para extração de dados do PDF

const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   1032     MARIA APARECIDA ALVES DE MELO                                   Segunda                    -      -     -     -     -     -     08:00
05/05/25   5697     ROBERTO DE CESAR MATTOS HADAD                                   Terça                      -      -     -     -     -     -     08:00
05/05/25   6412     VITOR DONIZETE DA SILVA        08:00 - 12:00 - 13:00 - 17:00    06:59                      -      -     -     -     -     -     08:00
05/05/25   6579     RODRIGO BELIZARIO DOS SANTOS                                    Segunda                    -      -     -     -     -     -     08:00
05/05/25   6800     ANDREA CRISTINA DE OLIVEIRA                                     Segunda                    -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27
05/05/25   8393     JOSE SIRLEI CASSEMIRO                                           Segunda                    -      -     -     -     -     -     07:02
05/05/25  11667     LAVINIA APARECIDA DA SILVA BERNARDES  09:00 - 12:00 - 13:00 - 18:00    08:55 - 12:00 - 12:38 - 18:03    -      -     -     -     -     -     08:00
05/05/25  11750     MICAEL CAMARGO DOS SANTOS      09:00 - 12:00 - 13:00 - 18:00    09:03 - 12:00 - 13:00 - 18:00    -      -     -     -     -     -     08:00`;

console.log('Teste específico para extração de dados...\n');

// Função melhorada para extrair dados usando posições fixas
function extrairDadosLinha(linha) {
  // Verificar se a linha contém uma data
  const matchData = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
  if (!matchData) {
    return null;
  }
  
  console.log(`Analisando linha: "${linha}"`);
  console.log(`Tamanho: ${linha.length}`);
  
  // Analisar a estrutura baseada no cabeçalho:
  // Dia(8) + espaços + Matrícula(variável) + espaços + Nome(31) + Jornada(27) + Ponto + resto
  
  // Extrair data (primeiros 8 caracteres)
  const data = linha.substring(0, 8).trim();
  
  // Encontrar a matrícula (primeiro número após a data)
  const matriculaMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})\s+(\d{3,5})/);
  if (!matriculaMatch) {
    console.log('  Não foi possível extrair matrícula\n');
    return null;
  }
  
  const matricula = matriculaMatch[2];
  const matriculaIndex = linha.indexOf(matricula);
  const nomeStart = matriculaIndex + matricula.length;
  
  // Extrair nome - vai até encontrar um padrão de jornada ou ponto
  let nomeEnd = linha.length;
  
  // Procurar por padrões que indicam fim do nome
  const patterns = [
    /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/,  // jornada (2+ horários)
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
  
  // Debug específico para ELISA ESTER
  if (nome.includes('ELISA ESTER')) {
    console.log(`  DEBUG ELISA ESTER:`);
    console.log(`    Resto completo: "${resto}"`);
  }
  
  // Separar jornada e ponto
  let jornada = '';
  let ponto = '';
  
  // Procurar por jornada (4 horários seguidos)
  const jornadaMatch = resto.match(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
  
  if (jornadaMatch) {
    jornada = jornadaMatch[1];
    // O que vem depois da jornada é o ponto
    const jornadaIndex = resto.indexOf(jornada);
    const pontoCompleto = resto.substring(jornadaIndex + jornada.length).trim();
    
    // Debug específico para ELISA ESTER
    if (nome.includes('ELISA ESTER')) {
      console.log(`    Jornada encontrada: "${jornada}"`);
      console.log(`    Ponto completo: "${pontoCompleto}"`);
    }
    
    // Extrair a parte do ponto (antes das observações que começam com "-")
    // Procurar por sequência de horários (formato: HH:MM - HH:MM - HH:MM)
    const pontoMatch = pontoCompleto.match(/^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*)/);
    if (pontoMatch) {
      ponto = pontoMatch[1].trim();
    } else {
      // Se não encontrou horários, procurar por palavras (Falta, Segunda, etc.)
      const palavraMatch = pontoCompleto.match(/^([A-Za-zÀ-ÚÇ]+)/);
      if (palavraMatch) {
        ponto = palavraMatch[1].trim();
      } else {
        // Fallback: pegar tudo até o primeiro "-" isolado
        const parts = pontoCompleto.split(/\s+-\s+/);
        ponto = parts[0].trim();
      }
    }
    
    // Debug específico para ELISA ESTER
    if (nome.includes('ELISA ESTER')) {
      console.log(`    Ponto extraído: "${ponto}"`);
    }
  } else {
    // Se não tem jornada, procurar por ponto direto
    const pontoMatch = resto.match(/^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*)/);
    if (pontoMatch) {
      ponto = pontoMatch[1].trim();
    } else {
      // Se não encontrou horários, procurar por palavras (Falta, Segunda, etc.)
      const palavraMatch = resto.match(/^([A-Za-zÀ-ÚÇ]+)/);
      if (palavraMatch) {
        ponto = palavraMatch[1].trim();
      } else {
        // Fallback: pegar tudo até o primeiro "-" isolado
        const parts = resto.split(/\s+-\s+/);
        ponto = parts[0].trim();
      }
    }
  }
  
  // Extrair horários do ponto
  const horarios = ponto.match(/\d{2}:\d{2}/g) || [];
  
  // Determinar se é falta
  const eFalta = horarios.length === 0 || 
                 ponto.toLowerCase().includes('falta') || 
                 ['segunda', 'terça', 'quarta', 'quinta', 'sexta'].some(dia => 
                   ponto.toLowerCase().includes(dia));
  
  // Determinar tipo de jornada
  let tipoJornada = 'FALTA';
  if (!eFalta) {
    if (horarios.length >= 4) {
      tipoJornada = 'COMPLETA';
    } else if (horarios.length > 0) {
      tipoJornada = 'SIMPLES';
    }
  }
  
  console.log(`  Dados extraídos:`);
  console.log(`    Data: "${data}"`);
  console.log(`    Matrícula: "${matricula}"`);
  console.log(`    Nome: "${nome}"`);
  console.log(`    Jornada: "${jornada}"`);
  console.log(`    Ponto: "${ponto}"`);
  console.log(`    Horários: [${horarios.join(', ')}]`);
  console.log(`    É falta: ${eFalta}`);
  console.log(`    Tipo: ${tipoJornada}`);
  console.log('');
  
  return {
    data,
    matricula,
    nome,
    jornada,
    ponto,
    horarios,
    eFalta,
    tipoJornada
  };
}

// Processar cada linha
const linhas = sampleText.split('\n');
console.log(`Total de linhas: ${linhas.length}\n`);

const dadosExtraidos = [];

linhas.forEach((linha, index) => {
  if (linha.trim()) {
    const dados = extrairDadosLinha(linha);
    if (dados) {
      dadosExtraidos.push(dados);
    }
  }
});

console.log('\n=== RESUMO DOS DADOS EXTRAÍDOS ===\n');

dadosExtraidos.forEach((dados, index) => {
  console.log(`${index + 1}. ${dados.nome} (${dados.matricula})`);
  console.log(`   Data: ${dados.data}`);
  console.log(`   Horários: [${dados.horarios.join(', ')}]`);
  console.log(`   Falta: ${dados.eFalta}`);
  console.log(`   Tipo: ${dados.tipoJornada}`);
  console.log('');
});

// Verificar casos específicos mencionados pelo usuário
console.log('\n=== VERIFICAÇÃO DOS CASOS ESPECÍFICOS ===\n');

const anaLucia = dadosExtraidos.find(d => d.nome.includes('ANA LUCIA'));
if (anaLucia) {
  console.log('✓ ANA LUCIA ANDRADE PEIXOTO encontrada:');
  console.log(`  Matrícula: ${anaLucia.matricula} (esperado: 886)`);
  console.log(`  Falta: ${anaLucia.eFalta} (esperado: true)`);
  console.log(`  Horários: [${anaLucia.horarios.join(', ')}] (esperado: [])`);
} else {
  console.log('✗ ANA LUCIA ANDRADE PEIXOTO não encontrada');
}

const elisaEster = dadosExtraidos.find(d => d.nome.includes('ELISA ESTER'));
if (elisaEster) {
  console.log('\n✓ ELISA ESTER DE PAIVA encontrada:');
  console.log(`  Matrícula: ${elisaEster.matricula}`);
  console.log(`  Falta: ${elisaEster.eFalta} (esperado: false)`);
  console.log(`  Horários: [${elisaEster.horarios.join(', ')}] (esperado: [12:01, 12:33, 18:00])`);
} else {
  console.log('\n✗ ELISA ESTER DE PAIVA não encontrada');
} 