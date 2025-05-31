const fs = require('fs');
const pdf = require('pdf-parse');

async function analisarPDF() {
  try {
    console.log('=== ANÁLISE SIMPLES DO PDF ===\n');
    
    const pdfPath = './Relatorio Ponto para utilizar no sistema (1).pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Arquivo PDF não encontrado:', pdfPath);
      return;
    }
    
    console.log('📄 Lendo PDF...');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log(`📊 Texto extraído: ${data.text.length} caracteres\n`);
    
    // Dividir em linhas
    const linhas = data.text.split('\n').filter(linha => linha.trim().length > 0);
    
    console.log(`📋 Total de linhas: ${linhas.length}\n`);
    
    // Procurar linhas que contêm data no formato dd/mm/aa
    const linhasComData = linhas.filter(linha => /\d{2}\/\d{2}\/\d{2}/.test(linha));
    
    console.log(`🎯 Linhas com data encontradas: ${linhasComData.length}\n`);
    
    // Mostrar as primeiras 10 linhas com data
    console.log('=== PRIMEIRAS 10 LINHAS COM DATA ===');
    for (let i = 0; i < Math.min(10, linhasComData.length); i++) {
      const linha = linhasComData[i];
      console.log(`\n${i + 1}. "${linha}"`);
      console.log(`   Tamanho: ${linha.length} caracteres`);
      
      // Extrair data
      const dataMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
      if (dataMatch) {
        const data = dataMatch[1];
        const dataIndex = linha.indexOf(data);
        console.log(`   Data: "${data}" na posição ${dataIndex}`);
        
        // Analisar o que vem depois da data
        const parteAposData = linha.substring(dataIndex + data.length);
        console.log(`   Após data: "${parteAposData}"`);
        
        // Procurar números (possíveis matrículas)
        const numeros = parteAposData.match(/\d+/g) || [];
        console.log(`   Números encontrados: [${numeros.join(', ')}]`);
        
        // Procurar nomes (sequências de letras maiúsculas)
        const nomes = parteAposData.match(/[A-Z][A-Z\s]+[A-Z]/g) || [];
        console.log(`   Possíveis nomes: [${nomes.join(', ')}]`);
      }
    }
    
    // Analisar uma linha específica em detalhes
    console.log('\n\n=== ANÁLISE DETALHADA ===');
    const linhaDetalhada = linhasComData[0]; // Primeira linha com data
    
    if (linhaDetalhada) {
      console.log(`\nLinha: "${linhaDetalhada}"`);
      console.log('\nAnálise caractere por caractere (primeiros 150):');
      
      for (let i = 0; i < Math.min(150, linhaDetalhada.length); i++) {
        const char = linhaDetalhada[i];
        const code = char.charCodeAt(0);
        
        if (i % 20 === 0) console.log(''); // Nova linha a cada 20 caracteres
        
        if (char === ' ') {
          process.stdout.write(`[SP] `);
        } else if (char === '\t') {
          process.stdout.write(`[TAB] `);
        } else {
          process.stdout.write(`${char} `);
        }
      }
      console.log('\n');
      
      // Tentar diferentes estratégias de parsing
      console.log('\n=== ESTRATÉGIAS DE PARSING ===');
      
      // Estratégia 1: Dividir por espaços múltiplos
      const partes1 = linhaDetalhada.split(/\s{2,}/);
      console.log('\n1. Divisão por espaços múltiplos:');
      partes1.forEach((parte, index) => {
        console.log(`   ${index}: "${parte}"`);
      });
      
      // Estratégia 2: Dividir por horários
      const partes2 = linhaDetalhada.split(/(\d{2}:\d{2})/);
      console.log('\n2. Divisão por horários:');
      partes2.forEach((parte, index) => {
        if (parte.trim()) {
          console.log(`   ${index}: "${parte}"`);
        }
      });
      
      // Estratégia 3: Procurar padrões específicos
      console.log('\n3. Padrões específicos:');
      
      // Data
      const dataMatch = linhaDetalhada.match(/(\d{2}\/\d{2}\/\d{2})/);
      if (dataMatch) {
        console.log(`   Data: "${dataMatch[1]}"`);
        
        // Tudo após a data
        const aposData = linhaDetalhada.substring(linhaDetalhada.indexOf(dataMatch[1]) + dataMatch[1].length);
        
        // Procurar matrícula (números no final)
        const matriculaMatch = aposData.match(/([A-Z\s]+?)(\d{3,6})$/);
        if (matriculaMatch) {
          console.log(`   Nome: "${matriculaMatch[1].trim()}"`);
          console.log(`   Matrícula: "${matriculaMatch[2]}"`);
        }
        
        // Procurar horários
        const horarios = aposData.match(/\d{2}:\d{2}/g) || [];
        console.log(`   Horários: [${horarios.join(', ')}]`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analisarPDF().catch(console.error); 