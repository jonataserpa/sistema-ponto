const fs = require('fs');
const path = require('path');

async function analisarLinhaPDF() {
  try {
    console.log('=== ANÁLISE DE LINHA DO PDF ===\n');
    
    // Importar serviços
    const { PdfService } = await import('./src/service/pdfService.ts');
    
    const pdfService = new PdfService();
    
    // Extrair texto do PDF
    const pdfPath = './Relatorio Ponto para utilizar no sistema (1).pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Arquivo PDF não encontrado:', pdfPath);
      return;
    }
    
    console.log('📄 Extraindo texto do PDF...');
    const texto = await pdfService.extractTextFromPdf(pdfPath);
    
    console.log(`📊 Texto extraído: ${texto.length} caracteres\n`);
    
    // Dividir em linhas
    const linhas = texto.split('\n').filter(linha => linha.trim().length > 0);
    
    console.log(`📋 Total de linhas: ${linhas.length}\n`);
    
    // Procurar linhas que contêm data no formato dd/mm/aa
    const linhasComData = linhas.filter(linha => /\d{2}\/\d{2}\/\d{2}/.test(linha));
    
    console.log(`🎯 Linhas com data encontradas: ${linhasComData.length}\n`);
    
    // Analisar as primeiras 5 linhas com data
    for (let i = 0; i < Math.min(5, linhasComData.length); i++) {
      const linha = linhasComData[i];
      console.log(`\n=== LINHA ${i + 1} ===`);
      console.log(`Conteúdo: "${linha}"`);
      console.log(`Tamanho: ${linha.length} caracteres`);
      
      // Analisar caractere por caractere para entender a estrutura
      console.log('\n📍 Análise caractere por caractere:');
      for (let j = 0; j < Math.min(100, linha.length); j++) {
        const char = linha[j];
        const code = char.charCodeAt(0);
        if (j % 10 === 0) console.log(''); // Nova linha a cada 10 caracteres
        process.stdout.write(`${char}(${code}) `);
      }
      console.log('\n');
      
      // Procurar padrões específicos
      const dataMatch = linha.match(/(\d{2}\/\d{2}\/\d{2})/);
      if (dataMatch) {
        console.log(`📅 Data encontrada: "${dataMatch[1]}" na posição ${linha.indexOf(dataMatch[1])}`);
        
        const parteAposData = linha.substring(linha.indexOf(dataMatch[1]) + dataMatch[1].length);
        console.log(`📝 Parte após data: "${parteAposData.substring(0, 50)}..."`);
        
        // Tentar diferentes padrões para matrícula
        const patterns = [
          /(\d{3,6})/,           // 3-6 dígitos
          /[^\d]*(\d{3,6})/,     // 3-6 dígitos após não-dígitos
          /\s+(\d{3,6})/,        // 3-6 dígitos após espaços
          /[A-Z]+(\d{3,6})/,     // 3-6 dígitos após letras maiúsculas
        ];
        
        console.log('\n🔍 Testando padrões para matrícula:');
        patterns.forEach((pattern, index) => {
          const match = parteAposData.match(pattern);
          if (match) {
            console.log(`  Padrão ${index + 1}: "${match[1]}" (posição ${parteAposData.indexOf(match[1])})`);
          } else {
            console.log(`  Padrão ${index + 1}: não encontrado`);
          }
        });
      }
      
      console.log('\n' + '='.repeat(80));
    }
    
    // Analisar uma linha específica que sabemos que tem dados
    console.log('\n\n=== ANÁLISE DETALHADA DE UMA LINHA ESPECÍFICA ===');
    const linhaEspecifica = linhasComData.find(linha => 
      linha.includes('ALESSANDRO') || 
      linha.includes('CRISTIANO') || 
      linha.includes('7791') ||
      linha.includes('8004')
    );
    
    if (linhaEspecifica) {
      console.log(`\nLinha escolhida: "${linhaEspecifica}"`);
      console.log(`Tamanho: ${linhaEspecifica.length}`);
      
      // Dividir a linha em segmentos lógicos
      const segments = linhaEspecifica.split(/(\d{2}:\d{2})/);
      console.log('\n📊 Segmentos divididos por horários:');
      segments.forEach((segment, index) => {
        if (segment.trim()) {
          console.log(`  ${index}: "${segment}"`);
        }
      });
      
      // Procurar por números que podem ser matrículas
      const numeros = linhaEspecifica.match(/\d+/g) || [];
      console.log('\n🔢 Todos os números encontrados:');
      numeros.forEach((numero, index) => {
        console.log(`  ${index}: "${numero}" (${numero.length} dígitos)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analisarLinhaPDF().catch(console.error); 