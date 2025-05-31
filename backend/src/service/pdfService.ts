import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import pdf from 'pdf-parse';
import ocrService from './ocrService';
import colaboradorRepository from '../repository/colaboradorRepository';
import registroRepository from '../repository/registroRepository';
import {
  ProcessamentoResult,
  RegistroExtracted,
  ColaboradorExtracted,
  BatidaExtracted,
  TipoBatida
} from '../infrastructure/types';

// Converter exec para Promise
const execPromise = util.promisify(exec);

/**
 * Serviço responsável pelo processamento de PDFs de espelho de ponto
 */
class PdfService {
  /**
   * Converte um PDF para imagens usando ferramentas externas (pdftoppm)
   * @param pdfPath Caminho do arquivo PDF
   * @param outputDir Diretório para salvar as imagens
   * @returns Array com os caminhos das imagens geradas
   */
  async convertPdfToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      // Verifica se o diretório existe, senão cria
      await fs.mkdir(outputDir, { recursive: true });
      
      // Nome base para as imagens
      const baseName = path.basename(pdfPath, '.pdf');
      const outputPath = path.join(outputDir, baseName);
      
      // Executa o comando pdftoppm para converter PDF em imagens
      // Nota: pdftoppm precisa estar instalado no sistema
      await execPromise(`pdftoppm -png -r 300 "${pdfPath}" "${outputPath}"`);
      
      // Lista as imagens geradas
      const files = await fs.readdir(outputDir);
      const imagePaths = files
        .filter(file => file.startsWith(baseName) && file.endsWith('.png'))
        .map(file => path.join(outputDir, file));
      
      return imagePaths;
    } catch (error) {
      console.error('Erro ao converter PDF para imagens:', error);
      throw new Error(`Falha ao converter PDF: ${(error as Error).message}`);
    }
  }

  /**
   * Extrai texto diretamente de um PDF (para PDFs com texto nativo)
   * @param pdfPath Caminho do arquivo PDF
   * @returns Texto extraído do PDF
   */
  async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error(`Falha ao extrair texto: ${(error as Error).message}`);
    }
  }

  /**
   * Processa um PDF de espelho de ponto e extrai os registros
   * @param filePath Caminho do arquivo PDF
   * @returns Resultado do processamento
   */
  async processarEspelhoPonto(filePath: string): Promise<ProcessamentoResult> {
    try {
      // Calcula o hash do arquivo para verificar duplicidade
      const hash = await ocrService.calculateFileHash(filePath);
      
      // Diretório temporário para as imagens
      const tempDir = path.join(process.env.UPLOAD_DIR || './uploads', 'temp', hash);
      
      // Resultado do processamento
      const result: ProcessamentoResult = {
        arquivo: {
          nome: path.basename(filePath),
          caminho: filePath,
          tamanho: (await fs.stat(filePath)).size,
          hash,
          processado: false
        },
        registros: [],
        totalProcessados: 0,
        erros: []
      };
      
      try {
        // Tenta primeiro extrair texto diretamente (se for PDF com texto nativo)
        const textoPdf = await this.extractTextFromPdf(filePath);
        
        // Se conseguiu extrair texto, processa diretamente
        if (textoPdf && textoPdf.length > 0) {
          const registros = await this.extrairRegistrosDeTexto(textoPdf);
          result.registros = registros;
          result.totalProcessados = registros.length;
        } else {
          // Se não conseguiu extrair texto, converte para imagens e usa OCR
          const imagePaths = await this.convertPdfToImages(filePath, tempDir);
          
          // Processa cada imagem com OCR
          for (const imagePath of imagePaths) {
            const ocrResult = await ocrService.processImage(imagePath);
            const textoNormalizado = ocrService.normalizeText(ocrResult.text);
            
            // Extrai os registros do texto OCR
            const registrosImagem = await this.extrairRegistrosDeTexto(textoNormalizado);
            result.registros.push(...registrosImagem);
          }
          
          result.totalProcessados = result.registros.length;
        }
        
        // Marca como processado
        result.arquivo.processado = true;
      } catch (error) {
        // Registra erro no processamento
        result.erros.push((error as Error).message);
        console.error('Erro no processamento do PDF:', error);
      } finally {
        // Limpa diretório temporário
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('Erro ao limpar diretório temporário:', cleanupError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Falha no processamento do espelho de ponto:', error);
      throw new Error(`Falha no processamento: ${(error as Error).message}`);
    }
  }

  /**
   * Extrai registros de ponto a partir do texto
   * @param texto Texto extraído do PDF ou OCR
   * @returns Array de registros extraídos
   */
  private async extrairRegistrosDeTexto(texto: string): Promise<RegistroExtracted[]> {
    const registros: RegistroExtracted[] = [];
    const colaboradoresSalvos = new Map<string, { id: number, nome: string }>();
    
    console.log("Iniciando extração de texto com tamanho:", texto.length);
    
    try {
      // Dividir o texto em linhas para processamento
      const linhas = texto.split('\n');
      console.log(`Total de linhas no texto: ${linhas.length}`);
      
      // Mapa para armazenar dados temporários dos colaboradores por data
      const dadosColaboradores = new Map<string, {
        colaborador: ColaboradorExtracted;
        jornada: string;
        batidas: string[];
        observacoes: string;
      }>();
      
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        
        if (!linha) continue;
        
        // Tentar extrair dados da linha usando a função atualizada
        const dadosExtraidos = this.tentarExtrairDadosLinha(linha);
        
        if (dadosExtraidos) {
          const { data: dataStr, matricula, nome, jornada, ponto, observacoes } = dadosExtraidos;
          
          console.log(`✅ Linha processada com sucesso: ${linha.substring(0, 50)}...`);
          console.log(`   Data: ${dataStr}, Matrícula: ${matricula}, Nome: ${nome}`);
          console.log(`   Jornada: ${jornada}, Ponto: ${ponto}`);
          
          // Validar dados básicos
          const chave = `${dataStr}_${matricula}`;
          
          if (nome.length > 3 && matricula.length >= 3) {
            // Processar batidas de ponto
            const batidas = this.extrairBatidasDaLinha(ponto);
            
            dadosColaboradores.set(chave, {
              colaborador: { matricula, nome },
              jornada: jornada || '',
              batidas,
              observacoes: observacoes || ''
            });
          }
        }
      }
      
      console.log(`Total de registros de colaboradores encontrados: ${dadosColaboradores.size}`);
      
      // Processar cada colaborador encontrado
      for (const [chave, dados] of dadosColaboradores.entries()) {
        try {
          const { colaborador, jornada, batidas, observacoes } = dados;
          const [dataStr] = chave.split('_');
          
          // Salvar/atualizar colaborador no banco
          let colaboradorDb = await colaboradorRepository.findByMatricula(colaborador.matricula);
          
          if (colaboradorDb) {
            if (colaboradorDb.nome !== colaborador.nome) {
              colaboradorDb = await colaboradorRepository.update(colaboradorDb.id, { nome: colaborador.nome });
              console.log(`Nome do colaborador atualizado: ${colaborador.matricula} - ${colaborador.nome}`);
            }
          } else {
            colaboradorDb = await colaboradorRepository.create({
              matricula: colaborador.matricula,
              nome: colaborador.nome
            });
            console.log(`Novo colaborador criado: ${colaborador.matricula} - ${colaborador.nome}`);
          }
          
          if (colaboradorDb && colaboradorDb.id) {
            colaboradoresSalvos.set(colaborador.matricula, {
              id: colaboradorDb.id,
              nome: colaboradorDb.nome
            });
            
            // Criar registro de ponto
            const registro = await this.criarRegistroPonto(
              dataStr,
              colaboradorDb.id,
              colaborador,
              jornada,
              batidas,
              observacoes
            );
            
            if (registro) {
              registros.push(registro);
            }
          }
        } catch (error) {
          console.error(`Erro ao processar colaborador ${dados.colaborador.matricula}:`, error);
        }
      }
      
      console.log(`Total de registros criados: ${registros.length}`);
      
    } catch (error) {
      console.error("Erro durante extração de registros:", error);
    }
    
    return registros;
  }

  /**
   * Extrai as batidas de ponto de uma string
   * @param pontoStr String contendo os horários de ponto
   * @returns Array de strings com os horários
   */
  private extrairBatidasDaLinha(pontoStr: string): string[] {
    console.log(`Extraindo batidas de: "${pontoStr}"`);
    
    if (!pontoStr) {
      console.log(`  Retornando [] (string vazia)`);
      return [];
    }
    
    // Verificar se contém palavras que indicam falta ou ausência
    const palavrasFalta = ['falta', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    const contemFalta = palavrasFalta.some(palavra => 
      pontoStr.toLowerCase().includes(palavra.toLowerCase())
    );
    
    if (contemFalta) {
      console.log(`  Retornando [] (contém palavra de falta/dia da semana)`);
      return [];
    }
    
    // Regex para extrair horários no formato HH:MM
    const regexHorarios = /\d{2}:\d{2}/g;
    const horarios = pontoStr.match(regexHorarios) || [];
    
    console.log(`  Horários extraídos: [${horarios.join(', ')}]`);
    
    return horarios;
  }

  /**
   * Tenta extrair dados de uma linha usando diferentes abordagens
   * @param linha Linha do texto
   * @returns Dados extraídos ou null
   */
  private tentarExtrairDadosLinha(linha: string): any {
    console.log(`\n🔍 Tentando extrair dados da linha: "${linha}"`);
    console.log(`📏 Tamanho da linha: ${linha.length}`);

    if (!linha || linha.trim().length === 0) {
      console.log('❌ Linha vazia');
      return null;
    }

    // 1. Procurar pela data no formato dd/mm/aa
    const regexData = /(\d{2}\/\d{2}\/\d{2})/;
    const matchData = linha.match(regexData);
    
    if (!matchData) {
      console.log('❌ Sem data no formato dd/mm/aa');
      return null;
    }
    
    const data = matchData[1];
    const posicaoData = linha.indexOf(data);
    console.log(`✅ Data encontrada: "${data}" na posição ${posicaoData}`);

    // 2. A matrícula está no FINAL da linha
    const regexMatriculaFinal = /(\d{3,6})$/;
    const matchMatricula = linha.match(regexMatriculaFinal);
    
    if (!matchMatricula) {
      console.log('❌ Sem matrícula no final da linha');
      return null;
    }
    
    const matricula = matchMatricula[1];
    console.log(`✅ Matrícula encontrada: "${matricula}"`);

    // 3. O nome está entre a data+observações e a matrícula
    const parteAposData = linha.substring(posicaoData + data.length);
    const posicaoMatricula = parteAposData.lastIndexOf(matricula);
    const parteNome = parteAposData.substring(0, posicaoMatricula);
    
    console.log(`📝 Parte do nome bruta: "${parteNome}"`);
    
    // 4. Extrair nome (remover observações como -----, 08:00, etc.)
    let nome = parteNome;
    
    // Remover padrões de observações
    nome = nome.replace(/^[:\-\s\d]+/, ''); // Remove início com números, traços, dois pontos
    nome = nome.replace(/[:\-\s\d]+$/, ''); // Remove final com números, traços, dois pontos
    nome = nome.trim();
    
    if (!nome || nome.length < 3) {
      console.log('❌ Nome inválido após limpeza');
      return null;
    }
    
    console.log(`✅ Nome extraído: "${nome}"`);

    // 5. A parte antes da data contém jornada esperada e ponto real
    const parteAntesData = linha.substring(0, posicaoData);
    console.log(`📝 Parte antes da data: "${parteAntesData}"`);
    
    // Dividir em jornada esperada e ponto real
    // Procurar por padrões de 4 horários (jornada completa)
    const regexJornadaCompleta = /(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/g;
    const jornadas = parteAntesData.match(regexJornadaCompleta) || [];
    
    let jornadaEsperada = '';
    let pontoReal = '';
    
    if (jornadas.length >= 2) {
      // Duas jornadas completas: primeira é esperada, segunda é real
      jornadaEsperada = jornadas[0] || '';
      pontoReal = jornadas[1] || '';
    } else if (jornadas.length === 1) {
      // Uma jornada: pode ser esperada, procurar horários individuais depois
      jornadaEsperada = jornadas[0] || '';
      const aposJornada = parteAntesData.substring(parteAntesData.indexOf(jornadaEsperada) + jornadaEsperada.length);
      const horariosIndividuais = aposJornada.match(/\d{2}:\d{2}/g) || [];
      if (horariosIndividuais.length > 0) {
        pontoReal = horariosIndividuais.join(' - ');
      }
    } else {
      // Sem jornada completa, pode ser falta ou status especial
      const regexStatus = /\b(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo|Falta|Folga)\b/i;
      const matchStatus = parteAntesData.match(regexStatus);
      if (matchStatus && matchStatus[1]) {
        pontoReal = matchStatus[1];
      } else {
        // Procurar por horários individuais
        const horariosIndividuais = parteAntesData.match(/\d{2}:\d{2}/g) || [];
        if (horariosIndividuais.length > 0) {
          pontoReal = horariosIndividuais.join(' - ');
        }
      }
    }
    
    console.log(`✅ Jornada esperada: "${jornadaEsperada}"`);
    console.log(`✅ Ponto real: "${pontoReal}"`);

    // 6. Extrair horários do ponto real
    const horariosReais = pontoReal.match(/\d{2}:\d{2}/g) || [];
    console.log(`✅ Horários extraídos: [${horariosReais.join(', ')}]`);
    
    // 7. Determinar status
    const isFalta = horariosReais.length === 0 || 
                   /\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo|folga)\b/i.test(pontoReal);
    
    const status = isFalta ? 'Falta' : 'Presente';
    console.log(`✅ Status: ${status}`);

    // Converter data para formato ISO
    const [dia, mes, ano] = data.split('/');
    const anoCompleto = `20${ano}`;
    const dataISO = `${anoCompleto}-${mes}-${dia}`;
    
    console.log(`✅ Data ISO: ${dataISO}`);

    return {
      data: dataISO,
      jornada: jornadaEsperada || '',
      status: status,
      matricula: matricula,
      nome: nome,
      ponto: pontoReal || ''
    };
  }

  /**
   * Cria um registro de ponto com base nos dados extraídos
   * @param dataStr String da data no formato DD/MM/YY
   * @param colaboradorId ID do colaborador no banco
   * @param colaborador Dados do colaborador
   * @param jornada String da jornada de trabalho
   * @param batidasStr Array de strings com os horários
   * @param observacoes Observações adicionais
   * @returns Registro extraído ou null
   */
  private async criarRegistroPonto(
    dataStr: string,
    colaboradorId: number,
    colaborador: ColaboradorExtracted,
    jornada: string,
    batidasStr: string[],
    observacoes: string
  ): Promise<RegistroExtracted | null> {
    try {
      // Converter data - verificar se já está no formato ISO ou se precisa converter
      let data: Date;
      if (dataStr.includes('-')) {
        // Formato ISO (YYYY-MM-DD)
        data = new Date(dataStr);
      } else {
        // Formato brasileiro (DD/MM/AA)
        data = this.parseDataCompleta(dataStr);
      }
      
      // Verificar se a data é válida
      if (isNaN(data.getTime())) {
        console.error(`❌ Data inválida: "${dataStr}"`);
        return null;
      }
      
      // Determinar se é falta - verificar se não há batidas OU se contém palavras de falta
      const isFalta = batidasStr.length === 0 || 
                     jornada.toLowerCase().includes('falta') ||
                     observacoes.toLowerCase().includes('falta') ||
                     batidasStr.some(batida => /\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/i.test(batida));
      
      console.log(`Criando registro para ${colaborador.nome}:`);
      console.log(`  - Batidas: [${batidasStr.join(', ')}]`);
      console.log(`  - É falta: ${isFalta}`);
      
      // Determinar tipo de jornada baseado no número de batidas reais
      let tipoJornada: 'COMPLETA' | 'SIMPLES' | 'FALTA';
      if (isFalta) {
        tipoJornada = 'FALTA';
      } else if (batidasStr.length >= 3) {
        // 3 ou mais batidas = jornada completa (pode ter saído mais cedo)
        tipoJornada = 'COMPLETA';
      } else {
        // 1 ou 2 batidas = jornada simples
        tipoJornada = 'SIMPLES';
      }
      
      console.log(`  - Tipo jornada: ${tipoJornada}`);
      
      const batidasEsperadas = this.getBatidasEsperadas(tipoJornada);
      
      // Converter strings de horário para objetos BatidaExtracted
      const batidas: BatidaExtracted[] = [];
      
      // Processar todas as batidas disponíveis, não apenas as esperadas
      for (let i = 0; i < batidasStr.length; i++) {
        const horarioStr = batidasStr[i];
        
        // Pular se for uma palavra de falta
        if (/\b(falta|segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/i.test(horarioStr)) {
          continue;
        }
        
        // Determinar o tipo de batida baseado na posição e no tipo de jornada
        let tipoBatida: TipoBatida;
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
          const horario = this.combineDateHora(data, horarioStr);
          batidas.push({
            horario,
            tipo: tipoBatida
          });
        } catch (error) {
          console.error(`Erro ao processar horário ${horarioStr}:`, error);
        }
      }
      
      // Calcular atrasos e horas extras
      const { atrasoMinutos, extraMinutos } = this.calcularAtrasoExtra(
        batidas,
        tipoJornada,
        jornada
      );
      
      // Criar registro
      const registro: RegistroExtracted = {
        data,
        colaborador,
        batidas,
        falta: isFalta,
        atrasoMinutos,
        extraMinutos
      };
      
      console.log(`Criando registro para ${colaborador.nome} em ${dataStr}:`);
      console.log(`  - Batidas: ${batidas.length} (${batidasStr.join(', ')})`);
      console.log(`  - Falta: ${isFalta}`);
      console.log(`  - Tipo: ${tipoJornada}`);
      
      // Salvar no banco de dados
      await registroRepository.createOrUpdate(registro, colaboradorId);
      
      console.log(`✓ Registro salvo no banco para ${colaborador.nome} em ${dataStr}: ${batidas.length} batidas, Falta: ${isFalta}`);
      
      return registro;
    } catch (error) {
      console.error(`Erro ao criar registro para ${colaborador.nome}:`, error);
      return null;
    }
  }

  /**
   * Determina o tipo de jornada com base na string de jornada
   * @param jornada String da jornada
   * @returns Tipo de jornada
   */
  private determinarTipoJornada(jornada: string): 'COMPLETA' | 'SIMPLES' | 'FALTA' {
    if (!jornada || jornada.toLowerCase().includes('falta')) {
      return 'FALTA';
    }
    
    // Contar quantos horários tem na jornada
    const horarios = jornada.match(/\d{2}:\d{2}/g) || [];
    
    if (horarios.length >= 4) {
      return 'COMPLETA'; // 4 horários: entrada, saída almoço, retorno almoço, saída
    } else if (horarios.length >= 2) {
      return 'SIMPLES'; // 2 horários: entrada e saída
    }
    
    return 'FALTA';
  }

  /**
   * Retorna os tipos de batida esperados para cada tipo de jornada
   * @param tipoJornada Tipo de jornada
   * @returns Array com os tipos de batida esperados
   */
  private getBatidasEsperadas(tipoJornada: 'COMPLETA' | 'SIMPLES' | 'FALTA'): TipoBatida[] {
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

  /**
   * Calcula atraso e horas extras com base nas batidas
   * @param batidas Array de batidas registradas
   * @param tipoJornada Tipo de jornada
   * @param jornadaStr String original da jornada
   * @returns Objeto com atraso e horas extras em minutos
   */
  private calcularAtrasoExtra(
    batidas: BatidaExtracted[],
    tipoJornada: 'COMPLETA' | 'SIMPLES' | 'FALTA',
    jornadaStr: string
  ): { atrasoMinutos: number; extraMinutos: number } {
    let atrasoMinutos = 0;
    let extraMinutos = 0;
    
    if (tipoJornada === 'FALTA' || batidas.length === 0) {
      return { atrasoMinutos, extraMinutos };
    }
    
    try {
      // Extrair horários esperados da jornada
      const horariosEsperados = jornadaStr.match(/\d{2}:\d{2}/g) || [];
      
      // Calcular atraso na entrada
      if (batidas.length > 0 && horariosEsperados.length > 0 && horariosEsperados[0]) {
        const entradaEsperada = this.parseHorario(horariosEsperados[0]);
        const entradaReal = batidas[0].horario;
        
        const diferencaEntrada = entradaReal.getTime() - entradaEsperada.getTime();
        if (diferencaEntrada > 0) {
          atrasoMinutos = Math.floor(diferencaEntrada / (1000 * 60));
        }
      }
      
      // Calcular horas extras na saída
      if (tipoJornada === 'COMPLETA' && batidas.length >= 4 && horariosEsperados.length >= 4 && horariosEsperados[3]) {
        const saidaEsperada = this.parseHorario(horariosEsperados[3]);
        const saidaReal = batidas[3].horario;
        
        const diferencaSaida = saidaReal.getTime() - saidaEsperada.getTime();
        if (diferencaSaida > 0) {
          extraMinutos = Math.floor(diferencaSaida / (1000 * 60));
        }
      } else if (tipoJornada === 'SIMPLES' && batidas.length >= 2 && horariosEsperados.length >= 2 && horariosEsperados[1]) {
        const saidaEsperada = this.parseHorario(horariosEsperados[1]);
        const saidaReal = batidas[1].horario;
        
        const diferencaSaida = saidaReal.getTime() - saidaEsperada.getTime();
        if (diferencaSaida > 0) {
          extraMinutos = Math.floor(diferencaSaida / (1000 * 60));
        }
      }
    } catch (error) {
      console.error('Erro ao calcular atraso/extra:', error);
    }
    
    return { atrasoMinutos, extraMinutos };
  }

  /**
   * Converte uma string de hora para um objeto Date (apenas hora)
   * @param horaStr String de hora no formato HH:MM
   * @returns Objeto Date com a hora
   */
  private parseHorario(horaStr: string): Date {
    const [hora, minuto] = horaStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hora, minuto, 0, 0);
    return date;
  }

  /**
   * Converte uma string de data para um objeto Date (formato DD/MM/YY)
   * @param dateStr String de data no formato DD/MM/YY
   * @returns Objeto Date
   */
  private parseDataCompleta(dateStr: string): Date {
    const [dia, mes, anoStr] = dateStr.split('/').map(Number);
    // Assumir que anos de 2 dígitos são do século 21 (20XX)
    const ano = anoStr < 50 ? 2000 + anoStr : 1900 + anoStr;
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Converte uma string de data para um objeto Date
   * @param dateStr String de data no formato DD/MM/YYYY
   * @returns Objeto Date
   */
  private parseData(dateStr: string): Date {
    const [dia, mes, ano] = dateStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Combina uma data e uma hora para criar um objeto Date completo
   * @param data Objeto Date com a data
   * @param horaStr String de hora no formato HH:MM
   * @returns Objeto Date com data e hora combinados
   */
  private combineDateHora(data: Date, horaStr: string): Date {
    const [hora, minuto] = horaStr.split(':').map(Number);
    const result = new Date(data);
    result.setHours(hora, minuto, 0, 0);
    return result;
  }
}

export default new PdfService(); 