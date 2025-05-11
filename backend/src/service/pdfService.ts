import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import pdf from 'pdf-parse';
import ocrService from './ocrService';
import colaboradorRepository from '../repository/colaboradorRepository';
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
      // Identificar os departamentos
      const departamentos = texto.match(/Departamento:\s*([^\n]+)/g) || [];
      console.log("Departamentos encontrados:", departamentos.length);
      
      if (departamentos.length === 0) {
        console.warn("Nenhum departamento encontrado no texto");
        return registros;
      }
      
      // Imprimir uma amostra do texto para depuração
      console.log("Amostra do texto (primeiros 500 caracteres):");
      console.log(texto.substring(0, 500));
      
      // Extrair diretamente todos os nomes de colaboradores
      // Ajustando o regex para pegar nomes em maiúsculas seguidos de números (formato no exemplo)
      // Estamos procurando padrões como "JOSE SIRLEI CASSEMIRO1397"
      const regexNomes = /([A-ZÀ-ÚÇ\s]+)(\d{3,4})/g;
      
      let matchNome;
      const colaboradoresEncontrados = new Map<string, string>(); // matrícula -> nome
      
      // Procurar todos os nomes no texto completo
      console.log("Iniciando busca por nomes de colaboradores...");
      
      while ((matchNome = regexNomes.exec(texto)) !== null) {
        console.log("Match encontrado:", matchNome[0]);
        
        // O grupo 1 contém o nome, o grupo 2 contém a matrícula
        let nomeCompleto = matchNome[1].trim();
        const matricula = matchNome[2].trim();
        
        console.log("Nome extraído:", nomeCompleto);
        console.log("Matrícula extraída:", matricula);
        
        // Verificar se o nome e a matrícula são válidos
        if (nomeCompleto && matricula && matricula.length >= 3 && nomeCompleto.length > 3) {
          // Limpar possíveis caracteres extras no nome
          nomeCompleto = nomeCompleto.replace(/\s+/g, ' ').trim();
          
          if (!colaboradoresEncontrados.has(matricula)) {
            colaboradoresEncontrados.set(matricula, nomeCompleto);
            console.log(`Colaborador encontrado: Matrícula ${matricula}, Nome: ${nomeCompleto}`);
          }
        } else {
          console.log("Match rejeitado por não atender aos critérios mínimos");
        }
      }
      
      // Se não encontrou colaboradores com o primeiro regex, tenta uma abordagem alternativa
      if (colaboradoresEncontrados.size === 0) {
        console.log("Tentando abordagem alternativa para identificar colaboradores...");
        
        // Tenta encontrar padrões como "NOME SOBRENOME     1234" (com múltiplos espaços entre nome e matrícula)
        const regexAlternativo = /([A-ZÀ-ÚÇ\s]{10,})\s+(\d{3,4})/g;
        
        while ((matchNome = regexAlternativo.exec(texto)) !== null) {
          console.log("Match alternativo encontrado:", matchNome[0]);
          
          const nomeCompleto = matchNome[1].trim();
          const matricula = matchNome[2].trim();
          
          console.log("Nome extraído (alt):", nomeCompleto);
          console.log("Matrícula extraída (alt):", matricula);
          
          if (nomeCompleto && matricula && !colaboradoresEncontrados.has(matricula)) {
            colaboradoresEncontrados.set(matricula, nomeCompleto);
            console.log(`Colaborador encontrado (alternativo): Matrícula ${matricula}, Nome: ${nomeCompleto}`);
          }
        }
      }
      
      // Segunda abordagem alternativa: procurar por linhas específicas
      if (colaboradoresEncontrados.size === 0) {
        console.log("Tentando abordagem por linhas para identificar colaboradores...");
        
        // Divide o texto em linhas
        const linhas = texto.split('\n');
        
        for (const linha of linhas) {
          // Procura por padrões que contenham uma data seguida de um nome em maiúsculas e números
          const matchLinha = linha.match(/\d{2}\/\d{2}\/\d{2}.*?([A-ZÀ-ÚÇ\s]+)(\d{3,4})/);
          
          if (matchLinha) {
            console.log("Linha com possível colaborador:", linha);
            
            const nomeCompleto = matchLinha[1].trim();
            const matricula = matchLinha[2].trim();
            
            console.log("Nome extraído (linha):", nomeCompleto);
            console.log("Matrícula extraída (linha):", matricula);
            
            if (nomeCompleto && matricula && !colaboradoresEncontrados.has(matricula)) {
              colaboradoresEncontrados.set(matricula, nomeCompleto);
              console.log(`Colaborador encontrado (linha): Matrícula ${matricula}, Nome: ${nomeCompleto}`);
            }
          }
        }
      }
      
      console.log(`Total de colaboradores encontrados: ${colaboradoresEncontrados.size}`);
      
      // Salvar cada colaborador no banco de dados
      for (const [matricula, nome] of colaboradoresEncontrados.entries()) {
        try {
          // Verifica se o colaborador já existe
          let colaborador = await colaboradorRepository.findByMatricula(matricula);
          
          if (colaborador) {
            console.log(`Colaborador já existe no banco: ${matricula} - ${nome}`);
            
            // Atualiza o nome se for diferente
            if (colaborador.nome !== nome) {
              colaborador = await colaboradorRepository.update(colaborador.id, { nome });
              console.log(`Nome do colaborador atualizado: ${matricula} - ${nome}`);
            }
          } else {
            // Cria novo colaborador
            colaborador = await colaboradorRepository.create({ matricula, nome });
            console.log(`Novo colaborador criado no banco: ${matricula} - ${nome}`);
          }
          
          // Armazena para uso na geração de registros (quando implementarmos)
          if (colaborador && colaborador.id) {
            colaboradoresSalvos.set(matricula, { id: colaborador.id, nome: colaborador.nome });
          }
        } catch (error) {
          console.error(`Erro ao processar colaborador ${matricula}:`, error);
        }
      }
      
      console.log(`Total de colaboradores salvos com sucesso: ${colaboradoresSalvos.size}`);
      
      // Resto do código de processamento de registros será implementado depois
      // Por enquanto, retornamos um array vazio, conforme solicitado
    } catch (error) {
      console.error("Erro durante extração de colaboradores:", error);
    }
    
    return registros;
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