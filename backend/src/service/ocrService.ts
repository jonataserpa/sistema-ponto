import { createWorker, PSM } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { OcrResult, OcrOptions } from '../infrastructure/types';

/**
 * Serviço responsável pelo processamento OCR de imagens e documentos
 */
class OcrService {
  private defaultOptions: OcrOptions = {
    lang: 'por',
    oem: 1, // 1 = LSTM only
    psm: 6, // 6 = Assume a single uniform block of text
  };

  /**
   * Realiza o OCR em uma imagem
   * @param imagePath Caminho para a imagem
   * @param options Opções de OCR
   * @returns Resultado do OCR com o texto extraído e confiança
   */
  async processImage(imagePath: string, options?: OcrOptions): Promise<OcrResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Verifica se o arquivo existe
      await fs.access(imagePath);
      
      // Cria o worker do Tesseract
      const worker = await createWorker(opts.lang || 'por');
      
      // Configura o worker com os parâmetros de OCR
      if (opts.psm !== undefined) {
        // Conversão segura do número para o enum PSM
        const psmValue = this.mapPsmValue(opts.psm);
        if (psmValue !== undefined) {
          await worker.setParameters({
            tessedit_pageseg_mode: psmValue,
          });
        }
      }
      
      // Executa o OCR
      const { data } = await worker.recognize(imagePath);
      
      // Libera o worker
      await worker.terminate();
      
      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
      throw new Error(`Falha ao processar OCR: ${(error as Error).message}`);
    }
  }

  /**
   * Mapeia valores numéricos para os valores do enum PSM
   * @param value Valor numérico
   * @returns Valor correspondente do enum PSM ou undefined
   */
  private mapPsmValue(value: number): PSM | undefined {
    // Mapeamento de valores numéricos para o enum PSM
    const psmMap: Record<number, PSM> = {
      0: PSM.OSD_ONLY,
      1: PSM.AUTO_OSD,
      2: PSM.AUTO_ONLY,
      3: PSM.AUTO,
      4: PSM.SINGLE_COLUMN,
      5: PSM.SINGLE_BLOCK_VERT_TEXT,
      6: PSM.SINGLE_BLOCK,
      7: PSM.SINGLE_LINE,
      8: PSM.SINGLE_WORD,
      9: PSM.CIRCLE_WORD,
      10: PSM.SINGLE_CHAR,
      11: PSM.SPARSE_TEXT,
      12: PSM.SPARSE_TEXT_OSD,
      13: PSM.RAW_LINE,
    };

    return psmMap[value];
  }

  /**
   * Calcula o hash MD5 de um arquivo para evitar reprocessamento
   * @param filePath Caminho para o arquivo
   * @returns Hash MD5 do arquivo
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto
      .createHash('md5')
      .update(fileBuffer)
      .digest('hex');
  }

  /**
   * Limpa e padroniza o texto extraído pelo OCR
   * @param text Texto extraído pelo OCR
   * @returns Texto padronizado
   */
  normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Remove múltiplos espaços
      .replace(/[^\w\s:./-]/g, '')  // Remove caracteres especiais, mantendo pontos e traços
      .trim();  // Remove espaços no início e fim
  }
}

export default new OcrService(); 