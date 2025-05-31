import { Request, Response, NextFunction } from 'express';
import registroRepository from '../repository/registroRepository';

/**
 * Controlador para operações relacionadas aos registros de ponto
 */
class RegistroController {
  /**
   * Lista todos os registros com filtros opcionais
   */
  listarRegistros = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dataInicio, dataFim, colaboradorId, falta } = req.query;
      
      const filtros: {
        dataInicio?: Date;
        dataFim?: Date;
        colaboradorId?: number;
        falta?: boolean;
      } = {};
      
      // Aplicação dos filtros
      if (dataInicio) {
        filtros.dataInicio = new Date(dataInicio as string);
      }
      
      if (dataFim) {
        filtros.dataFim = new Date(dataFim as string);
      }
      
      if (colaboradorId) {
        filtros.colaboradorId = parseInt(colaboradorId as string, 10);
      }
      
      if (falta !== undefined) {
        filtros.falta = falta === 'true';
      }
      
      const registros = await registroRepository.findAll(filtros);
      
      res.status(200).json({
        total: registros.length,
        registros
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém um registro específico pelo ID
   */
  obterRegistro = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const registro = await registroRepository.findById(parseInt(id, 10));
      
      if (!registro) {
        res.status(404).json({ error: 'Registro não encontrado' });
        return;
      }
      
      res.status(200).json(registro);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém registros de um colaborador específico
   */
  obterRegistrosPorColaborador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { colaboradorId } = req.params;
      const { dataInicio, dataFim } = req.query;
      
      const filtros: {
        dataInicio?: Date;
        dataFim?: Date;
        colaboradorId: number;
      } = {
        colaboradorId: parseInt(colaboradorId, 10)
      };
      
      if (dataInicio) {
        filtros.dataInicio = new Date(dataInicio as string);
      }
      
      if (dataFim) {
        filtros.dataFim = new Date(dataFim as string);
      }
      
      const registros = await registroRepository.findAll(filtros);
      
      res.status(200).json({
        total: registros.length,
        registros
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém estatísticas de registros
   */
  obterEstatisticas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      const filtros: {
        dataInicio?: Date;
        dataFim?: Date;
      } = {};
      
      if (dataInicio) {
        filtros.dataInicio = new Date(dataInicio as string);
      }
      
      if (dataFim) {
        filtros.dataFim = new Date(dataFim as string);
      }
      
      const registros = await registroRepository.findAll(filtros);
      
      // Estatísticas básicas
      const totalRegistros = registros.length;
      const totalFaltas = registros.filter(r => r.falta).length;
      const totalAtrasos = registros.filter(r => r.atrasoMinutos > 0).length;
      const totalExtras = registros.filter(r => r.extraMinutos > 0).length;
      
      // Cálculo de totais
      const totalMinutosAtraso = registros.reduce((total, registro) => total + registro.atrasoMinutos, 0);
      const totalMinutosExtra = registros.reduce((total, registro) => total + registro.extraMinutos, 0);
      
      // Formatação das horas e minutos
      const formatarMinutos = (minutos: number) => {
        const horas = Math.floor(minutos / 60);
        const min = minutos % 60;
        return `${horas}h ${min}min`;
      };
      
      res.status(200).json({
        periodo: {
          inicio: filtros.dataInicio,
          fim: filtros.dataFim
        },
        totalRegistros,
        totalFaltas,
        totalAtrasos,
        totalExtras,
        tempoAtraso: {
          minutos: totalMinutosAtraso,
          formatado: formatarMinutos(totalMinutosAtraso)
        },
        tempoExtra: {
          minutos: totalMinutosExtra,
          formatado: formatarMinutos(totalMinutosExtra)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RegistroController(); 