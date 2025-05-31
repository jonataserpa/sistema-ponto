// Teste direto da extração de texto
const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

// Simular a lógica de extração do pdfService (versão corrigida)
function tentarExtrairDadosLinha(linha) {
  console.log(`\nProcessando linha: "${linha}"`);
  console.log(`Tamanho da linha: ${linha.length}`);
  
  // Verificar se a linha contém uma data
  const matchData = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
  if (!matchData) {
    console.log('Não contém data válida, ignorando');
    return null;
  }
  
  try {
    // Extrair data (primeiros 8 caracteres)
    const data = linha.substring(0, 8).trim();
    
    // Encontrar a matrícula (primeiro número após a data)
    const matriculaMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})\s+(\d{3,5})/);
    if (!matriculaMatch) {
      console.log('Não encontrou matrícula, ignorando');
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
    
    console.log(`  Data: "${data}"`);
    console.log(`  Matrícula: "${matricula}"`);
    console.log(`  Nome: "${nome}"`);
    console.log(`  Resto: "${resto}"`);
    
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
      
      // Verificar se o ponto contém "Falta" ou palavras similares
      if (/\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/i.test(pontoCompleto)) {
        ponto = 'Falta';
      } else {
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
      }
    } else {
      // Se não tem jornada, procurar por ponto direto
      // Verificar se contém "Falta" ou palavras similares
      if (/\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/i.test(resto)) {
        ponto = 'Falta';
      } else {
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
    }
    
    console.log(`  Jornada: "${jornada}"`);
    console.log(`  Ponto: "${ponto}"`);
    
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

function extrairBatidasDaLinha(pontoStr) {
  console.log(`\nExtraindo batidas de: "${pontoStr}"`);
  
  if (!pontoStr) {
    console.log('String vazia, retornando array vazio');
    return [];
  }
  
  // Palavras que indicam falta
  const palavrasFalta = ['falta', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  
  // Verificar se contém palavras de falta
  const temFalta = palavrasFalta.some(palavra => 
    pontoStr.toLowerCase().includes(palavra.toLowerCase())
  );
  
  if (temFalta) {
    console.log('Contém palavra de falta, retornando array vazio');
    return [];
  }
  
  // Extrair horários no formato HH:MM
  const regexHorarios = /\d{2}:\d{2}/g;
  const horarios = pontoStr.match(regexHorarios) || [];
  
  console.log(`Horários extraídos: [${horarios.join(', ')}]`);
  
  return horarios;
}

async function testarExtracaoCompleta() {
  console.log('=== TESTE DE EXTRAÇÃO DIRETA (VERSÃO CORRIGIDA) ===\n');
  
  const linhas = sampleText.split('\n');
  console.log(`Total de linhas: ${linhas.length}\n`);
  
  const registrosExtraidos = [];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    if (!linha) {
      console.log(`Linha ${i + 1}: vazia, ignorando`);
      continue;
    }
    
    console.log(`\n=== LINHA ${i + 1} ===`);
    
    const dadosExtraidos = tentarExtrairDadosLinha(linha);
    
    if (dadosExtraidos) {
      const { data, matricula, nome, jornada, ponto, observacoes } = dadosExtraidos;
      
      // Extrair batidas apenas do campo ponto (não da jornada)
      const batidasPonto = extrairBatidasDaLinha(ponto);
      
      // Determinar se é falta
      const isFalta = batidasPonto.length === 0 || 
                     jornada.toLowerCase().includes('falta') ||
                     observacoes.toLowerCase().includes('falta') ||
                     batidasPonto.some(batida => /\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/i.test(batida));
      
      console.log(`\nResultado final:`);
      console.log(`  - Nome: ${nome}`);
      console.log(`  - Matrícula: ${matricula}`);
      console.log(`  - Data: ${data}`);
      console.log(`  - Batidas do ponto: [${batidasPonto.join(', ')}]`);
      console.log(`  - É falta: ${isFalta}`);
      
      // Determinar tipo de jornada
      let tipoJornada;
      if (isFalta) {
        tipoJornada = 'FALTA';
      } else if (batidasPonto.length >= 3) {
        tipoJornada = 'COMPLETA';
      } else {
        tipoJornada = 'SIMPLES';
      }
      
      console.log(`  - Tipo de jornada: ${tipoJornada}`);
      
      registrosExtraidos.push({
        nome,
        matricula,
        data,
        batidas: batidasPonto,
        falta: isFalta,
        tipoJornada
      });
    }
  }
  
  console.log(`\n=== RESUMO FINAL ===`);
  console.log(`Total de registros extraídos: ${registrosExtraidos.length}`);
  
  registrosExtraidos.forEach((registro, index) => {
    console.log(`\nRegistro ${index + 1}:`);
    console.log(`  - ${registro.nome} (${registro.matricula})`);
    console.log(`  - Data: ${registro.data}`);
    console.log(`  - Falta: ${registro.falta}`);
    console.log(`  - Tipo: ${registro.tipoJornada}`);
    console.log(`  - Batidas: [${registro.batidas.join(', ')}]`);
  });
  
  return registrosExtraidos;
}

// Executar o teste
testarExtracaoCompleta().then((registros) => {
  console.log('\n=== TESTE CONCLUÍDO ===');
  console.log(`Registros processados: ${registros.length}`);
}).catch(error => {
  console.error('\n✗ Erro:', error);
}); 