// Teste completo para debug do pdfService

const sampleText = `Departamento: PREFEITURA

Dia     Matrícula    Nome                           Jornada                    Ponto 
                     Obs    HT    AN    EX    EN    AT    FA
05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00
05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27`;

console.log('=== DEBUG COMPLETO DO PDFSERVICE ===\n');

// Simular extrairRegistrosDeTexto
async function extrairRegistrosDeTexto(texto) {
  const registros = [];
  const colaboradoresSalvos = new Map();
  
  console.log("Iniciando extração de texto com tamanho:", texto.length);
  
  try {
    // Identificar os departamentos
    const departamentos = texto.match(/Departamento:\s*([^\n]+)/g) || [];
    console.log("Departamentos encontrados:", departamentos.length);
    
    if (departamentos.length === 0) {
      console.warn("Nenhum departamento encontrado no texto");
      return registros;
    }
    
    // Dividir o texto em linhas para processamento
    const linhas = texto.split('\n');
    console.log(`Total de linhas no texto: ${linhas.length}`);
    
    // Mapa para armazenar dados temporários dos colaboradores por data
    const dadosColaboradores = new Map();
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      if (!linha) continue;
      
      console.log(`\n--- Processando linha ${i + 1}: "${linha}"`);
      
      // Tentar extrair dados da linha usando diferentes abordagens
      const dadosExtraidos = tentarExtrairDadosLinha(linha);
      
      if (dadosExtraidos) {
        const { data: dataStr, matricula, nome, jornada, ponto, observacoes } = dadosExtraidos;
        
        console.log(`✓ Linha processada com sucesso:`);
        console.log(`  Data: ${dataStr}, Matrícula: ${matricula}, Nome: ${nome}`);
        console.log(`  Jornada: ${jornada}, Ponto: ${ponto}`);
        
        // Validar dados básicos
        const chave = `${dataStr}_${matricula}`;
        
        if (nome.length > 3 && matricula.length >= 3) {
          // Processar batidas de ponto
          console.log(`  Extraindo batidas do ponto: "${ponto}"`);
          const batidas = extrairBatidasDaLinha(ponto);
          
          dadosColaboradores.set(chave, {
            colaborador: { matricula, nome },
            jornada: jornada || '',
            batidas,
            observacoes: observacoes || ''
          });
          
          console.log(`  ✓ Colaborador adicionado com chave: ${chave}`);
          console.log(`  ✓ Batidas extraídas: [${batidas.join(', ')}]`);
        } else {
          console.log(`  ✗ Dados inválidos: nome=${nome.length} chars, matricula=${matricula.length} chars`);
        }
      } else {
        // Log para linhas que não puderam ser processadas (apenas para debug)
        if (linha.includes('/') && linha.match(/\d/)) {
          console.log(`  ✗ Linha não processada (contém data mas não foi extraída)`);
        } else {
          console.log(`  - Linha ignorada (não contém dados relevantes)`);
        }
      }
    }
    
    console.log(`\n=== RESUMO DA EXTRAÇÃO ===`);
    console.log(`Total de registros de colaboradores encontrados: ${dadosColaboradores.size}`);
    
    // Processar cada colaborador encontrado
    let registrosCriados = 0;
    for (const [chave, dados] of dadosColaboradores.entries()) {
      try {
        const { colaborador, jornada, batidas, observacoes } = dados;
        const [dataStr] = chave.split('_');
        
        console.log(`\n--- Processando colaborador: ${colaborador.nome} (${colaborador.matricula})`);
        
        // Simular criação do colaborador no banco (sempre bem-sucedida para teste)
        const colaboradorId = parseInt(colaborador.matricula); // Simular ID
        console.log(`  ✓ Colaborador simulado no banco com ID: ${colaboradorId}`);
        
        // Criar registro de ponto
        console.log(`  Criando registro de ponto...`);
        const registro = await criarRegistroPonto(
          dataStr,
          colaboradorId,
          colaborador,
          jornada,
          batidas,
          observacoes
        );
        
        if (registro) {
          registros.push(registro);
          registrosCriados++;
          console.log(`  ✓ Registro criado com sucesso`);
        } else {
          console.log(`  ✗ Falha ao criar registro`);
        }
      } catch (error) {
        console.error(`  ✗ Erro ao processar colaborador ${dados.colaborador.matricula}:`, error);
      }
    }
    
    console.log(`\n=== RESULTADO FINAL ===`);
    console.log(`Total de registros criados: ${registrosCriados}`);
    
  } catch (error) {
    console.error("Erro durante extração de registros:", error);
  }
  
  return registros;
}

// Simular tentarExtrairDadosLinha
function tentarExtrairDadosLinha(linha) {
  // Verificar se a linha contém uma data
  const matchData = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
  if (!matchData) {
    return null;
  }
  
  try {
    // Extrair data (primeiros 8 caracteres)
    const data = linha.substring(0, 8).trim();
    
    // Encontrar a matrícula (primeiro número após a data)
    const matriculaMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})\s+(\d{3,5})/);
    if (!matriculaMatch) {
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

// Simular extrairBatidasDaLinha
function extrairBatidasDaLinha(pontoStr) {
  console.log(`    Extraindo batidas de: "${pontoStr}"`);
  
  if (!pontoStr) {
    console.log(`    Retornando [] (string vazia)`);
    return [];
  }
  
  // Verificar se contém palavras que indicam falta ou ausência
  const palavrasFalta = ['falta', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const contemFalta = palavrasFalta.some(palavra => 
    pontoStr.toLowerCase().includes(palavra.toLowerCase())
  );
  
  if (contemFalta) {
    console.log(`    Retornando [] (contém palavra de falta/dia da semana)`);
    return [];
  }
  
  // Regex para extrair horários no formato HH:MM
  const regexHorarios = /\d{2}:\d{2}/g;
  const horarios = pontoStr.match(regexHorarios) || [];
  
  console.log(`    Horários extraídos: [${horarios.join(', ')}]`);
  
  return horarios;
}

// Simular criarRegistroPonto
async function criarRegistroPonto(dataStr, colaboradorId, colaborador, jornada, batidasStr, observacoes) {
  try {
    console.log(`    Criando registro para ${colaborador.nome} em ${dataStr}:`);
    
    // Converter data (simular parseDataCompleta)
    const [dia, mes, anoStr] = dataStr.split('/').map(Number);
    const ano = anoStr < 50 ? 2000 + anoStr : 1900 + anoStr;
    const data = new Date(ano, mes - 1, dia);
    
    console.log(`    Data convertida: ${data.toISOString().split('T')[0]}`);
    
    // Determinar se é falta
    const isFalta = batidasStr.length === 0 || 
                   jornada.toLowerCase().includes('falta') ||
                   observacoes.toLowerCase().includes('falta');
    
    // Determinar tipo de jornada baseado no número de batidas reais (CORRIGIDO)
    let tipoJornada;
    if (isFalta || batidasStr.length === 0) {
      tipoJornada = 'FALTA';
    } else if (batidasStr.length >= 3) {
      // 3 ou mais batidas = jornada completa (pode ter saído mais cedo)
      tipoJornada = 'COMPLETA';
    } else {
      // 1 ou 2 batidas = jornada simples
      tipoJornada = 'SIMPLES';
    }
    
    console.log(`    - Batidas: ${batidasStr.length} (${batidasStr.join(', ')})`);
    console.log(`    - Falta: ${isFalta}`);
    console.log(`    - Tipo: ${tipoJornada}`);
    
    // Converter strings de horário para objetos BatidaExtracted (CORRIGIDO)
    const batidas = [];
    
    // Processar todas as batidas disponíveis, não apenas as esperadas
    for (let i = 0; i < batidasStr.length; i++) {
      const horarioStr = batidasStr[i];
      
      // Determinar o tipo de batida baseado na posição e no tipo de jornada
      let tipoBatida;
      if (tipoJornada === 'COMPLETA') {
        switch (i) {
          case 0: tipoBatida = 'ENTRADA'; break;
          case 1: tipoBatida = 'SAIDA_ALMOCO'; break;
          case 2: tipoBatida = 'RETORNO_ALMOCO'; break;
          case 3: tipoBatida = 'SAIDA'; break;
          default: tipoBatida = 'SAIDA'; break; // Batidas extras são consideradas saída
        }
      } else {
        // Para jornada simples
        tipoBatida = i === 0 ? 'ENTRADA' : 'SAIDA';
      }
      
      try {
        // Simular combineDateHora
        const [hora, minuto] = horarioStr.split(':').map(Number);
        const horario = new Date(data);
        horario.setHours(hora, minuto, 0, 0);
        
        batidas.push({
          horario,
          tipo: tipoBatida
        });
        
        console.log(`    - Batida ${i + 1}: ${horarioStr} (${tipoBatida}) -> ${horario.toISOString()}`);
      } catch (error) {
        console.error(`    Erro ao processar horário ${horarioStr}:`, error);
      }
    }
    
    // Criar registro
    const registro = {
      data,
      colaborador,
      batidas,
      falta: isFalta,
      atrasoMinutos: 0,
      extraMinutos: 0
    };
    
    // Simular salvamento no banco
    console.log(`    ✓ SIMULANDO: registroRepository.createOrUpdate(registro, ${colaboradorId})`);
    console.log(`    ✓ Registro simulado no banco para ${colaborador.nome} em ${dataStr}: ${batidas.length} batidas, Falta: ${isFalta}`);
    
    return registro;
  } catch (error) {
    console.error(`    Erro ao criar registro para ${colaborador.nome}:`, error);
    return null;
  }
}

// Executar o teste
extrairRegistrosDeTexto(sampleText).then(registros => {
  console.log(`\n=== TESTE CONCLUÍDO ===`);
  console.log(`Registros retornados: ${registros.length}`);
  
  registros.forEach((registro, index) => {
    console.log(`\nRegistro ${index + 1}:`);
    console.log(`  Colaborador: ${registro.colaborador.nome} (${registro.colaborador.matricula})`);
    console.log(`  Data: ${registro.data.toISOString().split('T')[0]}`);
    console.log(`  Falta: ${registro.falta}`);
    console.log(`  Batidas: ${registro.batidas.length}`);
    registro.batidas.forEach((batida, i) => {
      console.log(`    ${i + 1}. ${batida.horario.toTimeString().substring(0, 5)} (${batida.tipo})`);
    });
  });
}).catch(error => {
  console.error('Erro no teste:', error);
}); 