// Debug da conversão de data
console.log('=== DEBUG DA CONVERSÃO DE DATA ===\n');

function parseDataCompleta(dateStr) {
  console.log(`Convertendo data: "${dateStr}"`);
  
  if (!dateStr || typeof dateStr !== 'string') {
    console.log('❌ Data inválida ou não é string');
    return null;
  }
  
  const partes = dateStr.split('/');
  console.log(`Partes da data: [${partes.join(', ')}]`);
  
  if (partes.length !== 3) {
    console.log('❌ Data não tem 3 partes');
    return null;
  }
  
  const [dia, mes, anoStr] = partes.map(Number);
  console.log(`Dia: ${dia}, Mês: ${mes}, Ano: ${anoStr}`);
  
  // Assumir que anos de 2 dígitos são do século 21 (20XX)
  const ano = anoStr < 50 ? 2000 + anoStr : 1900 + anoStr;
  console.log(`Ano completo: ${ano}`);
  
  const data = new Date(ano, mes - 1, dia);
  console.log(`Data criada: ${data}`);
  console.log(`Data válida: ${!isNaN(data.getTime())}`);
  console.log(`ISO String: ${data.toISOString()}`);
  
  return data;
}

// Testar com diferentes formatos
const testeDatas = [
  '05/05/25',
  '2025-05-05',
  '05/05/2025',
  '',
  null,
  undefined,
  'invalid'
];

testeDatas.forEach((dataStr, index) => {
  console.log(`\n=== TESTE ${index + 1} ===`);
  try {
    const resultado = parseDataCompleta(dataStr);
    console.log(`Resultado: ${resultado}`);
  } catch (error) {
    console.log(`Erro: ${error.message}`);
  }
});

// Testar especificamente o formato ISO que está sendo retornado
console.log('\n=== TESTE DO FORMATO ISO ===');
const dataISO = '2025-05-05';
console.log(`Testando: "${dataISO}"`);

// Simular como o Prisma recebe a data
const dataPrisma = new Date(dataISO);
console.log(`Data para Prisma: ${dataPrisma}`);
console.log(`É válida: ${!isNaN(dataPrisma.getTime())}`);
console.log(`ISO: ${dataPrisma.toISOString()}`);

// Testar o que acontece quando passamos uma string ISO diretamente
console.log('\n=== TESTE DIRETO COM STRING ISO ===');
try {
  const dataDirecta = new Date('2025-05-05');
  console.log(`Data direta: ${dataDirecta}`);
  console.log(`É válida: ${!isNaN(dataDirecta.getTime())}`);
} catch (error) {
  console.log(`Erro: ${error.message}`);
} 