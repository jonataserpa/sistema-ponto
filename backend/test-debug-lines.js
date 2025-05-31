const pdfService = require('./dist/service/pdfService.js');

// Linhas problemáticas do log
const linhasProblematicas = [
  "07:00 - 12:00 - 13:00 - 16:00Falta05/05/25-----08:00JOSE SIRLEI CASSEMIRO1397",
  "08:00 - 12:00 - 13:00 - 17:00Falta05/05/25-----08:00ANA LUCIA ANDRADE PEIXOTO886",
  "07:00 - 12:00 - 13:00 - 16:00 - 07:06 - 11:57 - 12:58 - 15:5905/05/2508:00-----DARLAN VICTOR DE CASTRO E LOPES12005",
  "09:00 - 12:00 - 13:00 - 18:00 - 12:00 - 12:33 - 18:0005/05/2500:33---07:27-ROSA ESTER DE PAIVA6800",
  "Segunda05/05/25-----08:00MARIA APARECIDA ALVES DE MELO1032"
];

// Função para testar extração de dados de uma linha (copiada da lógica do pdfService)
function tentarExtrairDadosLinha(linha) {
  console.log(`\n=== PROCESSANDO LINHA ===`);
  console.log(`Linha original: "${linha}"`);
  console.log(`Tamanho da linha: ${linha.length}`);
  
  // Verificar se a linha contém uma data
  const matchData = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
  if (!matchData) {
    console.log(`❌ Nenhuma data encontrada no formato dd/mm/aa`);
    return null;
  }
  
  try {
    console.log(`✅ Data encontrada: "${matchData[1]}"`);
    
    // Extrair a data
    const data = matchData[1];
    const dataIndex = linha.indexOf(data);
    
    console.log(`📍 Posição da data na linha: ${dataIndex}`);
    
    // Encontrar a matrícula (números no final da linha)
    const matriculaMatch = linha.match(/([A-ZÀ-ÚÇ\s]+?)(\d{3,5})\s*$/);
    if (!matriculaMatch) {
      console.log(`❌ Não foi possível extrair matrícula com regex: /([A-ZÀ-ÚÇ\\s]+?)(\\d{3,5})\\s*$/`);
      
      // Tentar regex alternativo para matrícula
      const matriculaAlt = linha.match(/(\d{3,5})\s*$/);
      if (matriculaAlt) {
        console.log(`🔄 Matrícula encontrada com regex alternativo: "${matriculaAlt[1]}"`);
        // Tentar extrair nome manualmente
        const matriculaNum = matriculaAlt[1];
        const matriculaPos = linha.lastIndexOf(matriculaNum);
        const parteAnterior = linha.substring(0, matriculaPos).trim();
        
        // Procurar por nome após observações
        const nomeMatch = parteAnterior.match(/([A-ZÀ-ÚÇ\s]{3,})$/);
        if (nomeMatch) {
          console.log(`✅ Nome extraído: "${nomeMatch[1].trim()}"`);
          const nome = nomeMatch[1].trim();
          const matricula = matriculaNum;
          
          // Continuar processamento...
          const jornadaPontoStr = linha.substring(0, dataIndex);
          const dataEndIndex = dataIndex + data.length;
          const nomeStartIndex = linha.lastIndexOf(nome);
          const observacoes = linha.substring(dataEndIndex, nomeStartIndex).trim();
          
          console.log(`📝 Jornada+Ponto: "${jornadaPontoStr}"`);
          console.log(`📝 Observações: "${observacoes}"`);
          
          // Separar jornada e ponto
          let jornada = '';
          let ponto = '';
          
          // Estratégia: procurar por padrões de jornada no início
          const jornadaCompleta = jornadaPontoStr.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
          
          if (jornadaCompleta) {
            jornada = jornadaCompleta[1];
            ponto = jornadaPontoStr.substring(jornada.length).trim();
            ponto = ponto.replace(/^\s*-\s*/, '');
          } else {
            const jornadaSimples = jornadaPontoStr.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
            if (jornadaSimples) {
              jornada = jornadaSimples[1];
              ponto = jornadaPontoStr.substring(jornada.length).trim();
              ponto = ponto.replace(/^\s*-\s*/, '');
            } else {
              ponto = jornadaPontoStr.trim();
            }
          }
          
          console.log(`🎯 Jornada extraída: "${jornada}"`);
          console.log(`🎯 Ponto extraído: "${ponto}"`);
          
          if (!nome || nome.length < 3 || !matricula || matricula.length < 3) {
            console.log(`❌ Dados inválidos: nome="${nome}" (${nome.length} chars), matricula="${matricula}" (${matricula.length} chars)`);
            return null;
          }
          
          const resultado = {
            data: data.replace(/\s+/g, ''),
            matricula,
            nome: nome.replace(/\s+/g, ' ').trim(),
            jornada,
            ponto,
            observacoes
          };
          
          console.log(`✅ SUCESSO! Resultado:`, resultado);
          return resultado;
        }
      }
      
      return null;
    }
    
    const nome = matriculaMatch[1].trim();
    const matricula = matriculaMatch[2];
    
    console.log(`✅ Nome: "${nome}", Matrícula: "${matricula}"`);
    
    // Parte antes da data (jornada + ponto)
    const jornadaPontoStr = linha.substring(0, dataIndex);
    
    // Parte após a data até o nome (observações)
    const dataEndIndex = dataIndex + data.length;
    const nomeStartIndex = linha.lastIndexOf(nome);
    const observacoes = linha.substring(dataEndIndex, nomeStartIndex).trim();
    
    console.log(`📝 Jornada+Ponto: "${jornadaPontoStr}"`);
    console.log(`📝 Observações: "${observacoes}"`);
    
    // Separar jornada e ponto
    let jornada = '';
    let ponto = '';
    
    // Estratégia: procurar por padrões de jornada no início
    // Jornada completa: 4 horários (entrada, saída almoço, retorno almoço, saída)
    const jornadaCompleta = jornadaPontoStr.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
    
    if (jornadaCompleta) {
      jornada = jornadaCompleta[1];
      // O resto é o ponto
      ponto = jornadaPontoStr.substring(jornada.length).trim();
      
      // Remover separadores iniciais do ponto (como " - ")
      ponto = ponto.replace(/^\s*-\s*/, '');
    } else {
      // Jornada simples: 2 horários
      const jornadaSimples = jornadaPontoStr.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
      if (jornadaSimples) {
        jornada = jornadaSimples[1];
        ponto = jornadaPontoStr.substring(jornada.length).trim();
        ponto = ponto.replace(/^\s*-\s*/, '');
      } else {
        // Se não encontrou jornada padrão, considerar tudo como ponto
        ponto = jornadaPontoStr.trim();
      }
    }
    
    console.log(`🎯 Jornada extraída: "${jornada}"`);
    console.log(`🎯 Ponto extraído: "${ponto}"`);
    
    // Validar se temos dados mínimos
    if (!nome || nome.length < 3 || !matricula || matricula.length < 3) {
      console.log(`❌ Dados inválidos: nome="${nome}" (${nome.length} chars), matricula="${matricula}" (${matricula.length} chars)`);
      return null;
    }
    
    const resultado = {
      data: data.replace(/\s+/g, ''),
      matricula,
      nome: nome.replace(/\s+/g, ' ').trim(),
      jornada,
      ponto,
      observacoes
    };
    
    console.log(`✅ SUCESSO! Resultado:`, resultado);
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao extrair dados da linha:', error);
    return null;
  }
}

async function testarLinhasProblematicas() {
  console.log('=== TESTE DE LINHAS PROBLEMÁTICAS ===\n');
  
  for (let i = 0; i < linhasProblematicas.length; i++) {
    const linha = linhasProblematicas[i];
    console.log(`\n🔍 TESTANDO LINHA ${i + 1}:`);
    console.log(`"${linha}"`);
    console.log('─'.repeat(80));
    
    try {
      const resultado = tentarExtrairDadosLinha(linha);
      
      if (resultado) {
        console.log('✅ SUCESSO FINAL!');
        console.log('Resultado:', resultado);
      } else {
        console.log('❌ FALHOU - retornou null');
      }
    } catch (error) {
      console.error('❌ ERRO:', error.message);
    }
    
    console.log('═'.repeat(80));
  }
}

// Executar o teste
testarLinhasProblematicas().catch(console.error); 