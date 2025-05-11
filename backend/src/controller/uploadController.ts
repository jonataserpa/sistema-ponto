import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdfService from '../service/pdfService';
import colaboradorRepository from '../repository/colaboradorRepository';
import registroRepository from '../repository/registroRepository';
import { ProcessamentoResult, ColaboradorExtracted } from '../infrastructure/types';

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceitar apenas arquivos PDF
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'));
  }
};

// Configuração do upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB em bytes
  }
});

/**
 * Controlador para upload e processamento de arquivos PDF
 */
class UploadController {
  /**
   * Upload e processamento de um arquivo PDF
   */
  uploadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Realiza o upload do arquivo
      const uploadSingle = upload.single('arquivo');
      
      uploadSingle(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                error: 'Tamanho do arquivo excede o limite máximo permitido'
              });
            }
          }
          return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
          return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
        }
        
        try {
          // Processa o arquivo PDF
          const result: ProcessamentoResult = await pdfService.processarEspelhoPonto(req.file.path);
          console.log("Resultado do processamento:", result);
          
          // Salva os registros no banco de dados
          const { registrosSalvos, colaboradoresSalvos } = await this.salvarRegistros(result);
          
          // Retorna o resultado
          res.status(200).json({
            arquivo: {
              nome: req.file.originalname,
              tamanho: req.file.size,
              processado: result.arquivo.processado
            },
            totalProcessados: result.totalProcessados,
            colaboradoresSalvos,
            registrosSalvos,
            erros: result.erros
          });
        } catch (processError) {
          // Em caso de erro no processamento, exclui o arquivo
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Erro ao excluir arquivo:', unlinkError);
          }
          
          next(processError);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Salva os registros extraídos no banco de dados
   * @param result Resultado do processamento
   * @returns Quantidade de registros salvos e colaboradores salvos
   */
  private async salvarRegistros(result: ProcessamentoResult): Promise<{ registrosSalvos: number, colaboradoresSalvos: number }> {
    let registrosSalvos = 0;
    const colaboradoresProcessados = new Set<string>();
    
    try {
      console.log(`Iniciando processamento de ${result.registros.length} registros extraídos do PDF`);
      
      // Verificar se há registros para processar
      if (!result.registros || result.registros.length === 0) {
        console.warn("Nenhum registro foi extraído do PDF para ser processado");
        return { registrosSalvos: 0, colaboradoresSalvos: 0 };
      }
      
      // Contabilizar colaboradores distintos encontrados
      for (const registro of result.registros) {
        if (registro.colaborador && registro.colaborador.matricula) {
          colaboradoresProcessados.add(registro.colaborador.matricula);
        }
      }
      
      // Obs: Os colaboradores já foram salvos durante a extração no pdfService
      console.log(`Total de colaboradores distintos nos registros: ${colaboradoresProcessados.size}`);
      
      // Processar os registros
      console.log('Processando registros de ponto...');
      
      for (const registro of result.registros) {
        try {
          if (!registro.colaborador || !registro.colaborador.matricula) {
            console.warn("Registro sem informações de colaborador válidas, pulando...");
            continue;
          }
          
          const matricula = registro.colaborador.matricula;
          
          // Buscar colaborador pelo matrícula para obter o ID
          const colaborador = await colaboradorRepository.findByMatricula(matricula);
          
          if (colaborador) {
            // Cria ou atualiza o registro
            await registroRepository.createOrUpdate(registro, colaborador.id);
            registrosSalvos++;
            console.log(`Registro salvo para colaborador ${matricula} na data ${registro.data.toISOString().split('T')[0]}`);
          } else {
            console.warn(`Não foi possível encontrar colaborador com matrícula: ${matricula} - Este é um erro inesperado já que os colaboradores deveriam ter sido salvos durante a extração`);
          }
        } catch (registroError) {
          console.error('Erro ao salvar registro:', registroError);
          // Continua com o próximo registro
        }
      }
      
      console.log(`Total de registros salvos com sucesso: ${registrosSalvos}`);
      return { registrosSalvos, colaboradoresSalvos: colaboradoresProcessados.size };
    } catch (error) {
      console.error('Erro geral ao salvar registros:', error);
      throw new Error(`Falha ao salvar registros: ${(error as Error).message}`);
    }
  }
}

export default new UploadController(); 