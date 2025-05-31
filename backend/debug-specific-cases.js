// Debug específico para os casos mencionados pelo usuário

const casos = [
  {
    nome: "ANA LUCIA ANDRADE PEIXOTO",
    linha: "05/05/25    886     ANA LUCIA ANDRADE PEIXOTO      08:00 - 12:00 - 13:00 - 17:00    Falta                      -      -     -     -     -     -     08:00",
    esperado: { falta: true, batidas: [] }
  },
  {
    nome: "ELISA ESTER DE PAIVA", // Corrigindo o nome
    linha: "05/05/25   6861     ELISA ESTER DE PAIVA           09:00 - 12:00 - 13:00 - 18:00    12:01 - 12:33 - 18:00      -      -     00:33 -     -     07:27",
    esperado: { falta: false, batidas: ["12:01", "12:33", "18:00"] }
  },
  {
    nome: "LAVINIA APARECIDA DA SILVA BERNARDES",
    linha: "05/05/25  11667     LAVINIA APARECIDA DA SILVA BERNARDES  09:00 - 12:00 - 13:00 - 18:00    08:55 - 12:00 - 12:38 - 18:03    -      -     -     -     -     -     08:00",
    esperado: { falta: false, batidas: ["08:55", "12:00", "12:38", "18:03"] }
  }
];

console.log('=== ANÁLISE DOS CASOS ESPECÍFICOS ===\n');

function tentarExtrairDadosLinha(linha) {
  console.log(`\n--- ANALISANDO LINHA ---`);
  console.log(`Linha: "${linha}"`);
  console.log(`Tamanho: ${linha.length}`);

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
  
  // 3. NOVA LÓGICA: Buscar matrícula no início da parte após a data
  const regexMatricula = /^\s*(\d{3,6})\s+/;
  const matchMatricula = parteAposData.match(regexMatricula);
  
  if (!matchMatricula) {
    console.log(`❌ Não foi possível extrair matrícula`);
    return null;
  }

  const matricula = matchMatricula[1];
  console.log(`✅ Matrícula: "${matricula}"`);

  // 4. Extrair o resto após a matrícula
  const restoAposMatricula = parteAposData.substring(matchMatricula[0].length);
  console.log(`📝 Resto após matrícula: "${restoAposMatricula}"`);

  // 5. Buscar o nome (letras maiúsculas e espaços até encontrar horário ou palavra especial)
  const regexNome = /^([A-ZÁÊÇÕÀÂÃÉÍÓÚÜÑ\s]+?)(?=\s+\d{2}:\d{2}|\s+Falta|\s+Segunda|\s+Terça|\s+Quarta|\s+Quinta|\s+Sexta)/;
  const matchNome = restoAposMatricula.match(regexNome);
  
  if (!matchNome) {
    console.log(`❌ Não foi possível extrair nome`);
    return null;
  }

  const nomeCompleto = matchNome[1].trim();
  console.log(`✅ Nome: "${nomeCompleto}"`);

  // 6. Extrair o resto após o nome
  const restoAposNome = restoAposMatricula.substring(matchNome[0].length).trim();
  console.log(`📝 Resto após nome: "${restoAposNome}"`);

  // 7. Separar jornada e ponto
  let jornada = '';
  let ponto = '';

  // Procurar por jornada (4 horários seguidos no formato HH:MM - HH:MM - HH:MM - HH:MM)
  const regexJornada = /^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/;
  const matchJornada = restoAposNome.match(regexJornada);

  if (matchJornada) {
    jornada = matchJornada[1];
    console.log(`📋 Jornada encontrada: "${jornada}"`);
    
    // O que vem depois da jornada é o ponto
    const restoAposJornada = restoAposNome.substring(matchJornada[0].length).trim();
    console.log(`📝 Resto após jornada: "${restoAposJornada}"`);
    
    // LÓGICA CORRIGIDA: Extrair sequência de horários como ponto
    // Procurar por uma sequência de horários (HH:MM - HH:MM - HH:MM...) ou palavra especial
    const regexPonto = /^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*|Falta|Segunda|Terça|Quarta|Quinta|Sexta)/i;
    const matchPonto = restoAposJornada.match(regexPonto);
    
    if (matchPonto) {
      ponto = matchPonto[1].trim();
    } else {
      // Fallback: pegar tudo até encontrar um "-" isolado (não entre horários)
      const partesResto = restoAposJornada.split(/\s+-\s+/);
      ponto = partesResto[0].trim();
    }
  } else {
    // Se não tem jornada, procurar por sequência de horários ou palavra especial
    const regexPontoSemJornada = /^(\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})*|Falta|Segunda|Terça|Quarta|Quinta|Sexta)/i;
    const matchPontoSemJornada = restoAposNome.match(regexPontoSemJornada);
    
    if (matchPontoSemJornada) {
      ponto = matchPontoSemJornada[1].trim();
    } else {
      // Fallback: pegar tudo até encontrar um "-" isolado
      const partesResto = restoAposNome.split(/\s+-\s+/);
      ponto = partesResto[0].trim();
    }
  }

  console.log(`🎯 Ponto extraído: "${ponto}"`);

  // 8. Analisar o conteúdo do ponto para determinar se é falta
  const contemFalta = ponto.toLowerCase().includes('falta') || 
                     ponto.toLowerCase().includes('segunda') ||
                     ponto.toLowerCase().includes('terça') ||
                     ponto.toLowerCase().includes('quarta') ||
                     ponto.toLowerCase().includes('quinta') ||
                     ponto.toLowerCase().includes('sexta');

  console.log(`🔍 Contém palavra de falta: ${contemFalta}`);

  // 9. Extrair horários do ponto (apenas se não for falta)
  let batidasPonto = [];
  if (!contemFalta) {
    const regexHorarios = /\d{2}:\d{2}/g;
    batidasPonto = ponto.match(regexHorarios) || [];
  }

  console.log(`⏰ Batidas extraídas do ponto: [${batidasPonto.join(', ')}]`);

  // 10. Determinar se é falta
  const isFalta = contemFalta || batidasPonto.length === 0;

  console.log(`❓ É falta: ${isFalta}`);

  return {
    data,
    matricula,
    nome: nomeCompleto,
    jornada,
    ponto,
    batidas: batidasPonto,
    falta: isFalta
  };
}

// Testar cada caso
casos.forEach((caso, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`CASO ${index + 1}: ${caso.nome}`);
  console.log(`${'='.repeat(60)}`);
  
  const resultado = tentarExtrairDadosLinha(caso.linha);
  
  if (resultado) {
    console.log(`\n📊 RESULTADO:`);
    console.log(`   Nome: ${resultado.nome}`);
    console.log(`   Matrícula: ${resultado.matricula}`);
    console.log(`   Falta: ${resultado.falta}`);
    console.log(`   Batidas: [${resultado.batidas.join(', ')}]`);
    
    console.log(`\n🎯 ESPERADO:`);
    console.log(`   Falta: ${caso.esperado.falta}`);
    console.log(`   Batidas: [${caso.esperado.batidas.join(', ')}]`);
    
    console.log(`\n✅ VERIFICAÇÃO:`);
    const faltaCorreto = resultado.falta === caso.esperado.falta;
    const batidasCorretas = JSON.stringify(resultado.batidas) === JSON.stringify(caso.esperado.batidas);
    
    console.log(`   Falta: ${faltaCorreto ? '✅' : '❌'} (${resultado.falta} vs ${caso.esperado.falta})`);
    console.log(`   Batidas: ${batidasCorretas ? '✅' : '❌'} ([${resultado.batidas.join(', ')}] vs [${caso.esperado.batidas.join(', ')}])`);
    
    if (!faltaCorreto || !batidasCorretas) {
      console.log(`\n🔧 PROBLEMAS IDENTIFICADOS:`);
      if (!faltaCorreto) {
        console.log(`   - Falta incorreta: esperado ${caso.esperado.falta}, obtido ${resultado.falta}`);
      }
      if (!batidasCorretas) {
        console.log(`   - Batidas incorretas: esperado [${caso.esperado.batidas.join(', ')}], obtido [${resultado.batidas.join(', ')}]`);
      }
    }
  } else {
    console.log(`❌ FALHA: Não foi possível extrair dados da linha`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('ANÁLISE CONCLUÍDA');
console.log(`${'='.repeat(60)}`); 