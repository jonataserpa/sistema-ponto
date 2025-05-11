import { Request, Response, NextFunction } from 'express';
import colaboradorRepository from '../repository/colaboradorRepository';

/**
 * Controlador para operações relacionadas aos colaboradores
 */
class ColaboradorController {
  /**
   * Lista todos os colaboradores
   */
  listarColaboradores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const colaboradores = await colaboradorRepository.findAll();
      
      res.status(200).json({
        total: colaboradores.length,
        colaboradores
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém um colaborador específico pelo ID
   */
  obterColaborador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const colaborador = await colaboradorRepository.findById(parseInt(id, 10));
      
      if (!colaborador) {
        res.status(404).json({ error: 'Colaborador não encontrado' });
        return;
      }
      
      res.status(200).json(colaborador);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo colaborador
   */
  criarColaborador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { matricula, nome } = req.body;
      
      // Validação dos dados
      if (!matricula || !nome) {
        res.status(400).json({ error: 'Matrícula e nome são obrigatórios' });
        return;
      }
      
      // Verifica se já existe um colaborador com a mesma matrícula
      const colaboradorExistente = await colaboradorRepository.findByMatricula(matricula);
      
      if (colaboradorExistente) {
        res.status(409).json({ error: 'Já existe um colaborador com esta matrícula' });
        return;
      }
      
      // Cria o colaborador
      const colaborador = await colaboradorRepository.create({ matricula, nome });
      
      res.status(201).json(colaborador);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um colaborador existente
   */
  atualizarColaborador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      
      // Validação dos dados
      if (!nome) {
        res.status(400).json({ error: 'Nome é obrigatório' });
        return;
      }
      
      // Verifica se o colaborador existe
      const colaboradorExistente = await colaboradorRepository.findById(parseInt(id, 10));
      
      if (!colaboradorExistente) {
        res.status(404).json({ error: 'Colaborador não encontrado' });
        return;
      }
      
      // Atualiza o colaborador
      const colaborador = await colaboradorRepository.update(parseInt(id, 10), { nome });
      
      res.status(200).json(colaborador);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um colaborador
   */
  removerColaborador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Verifica se o colaborador existe
      const colaboradorExistente = await colaboradorRepository.findById(parseInt(id, 10));
      
      if (!colaboradorExistente) {
        res.status(404).json({ error: 'Colaborador não encontrado' });
        return;
      }
      
      // Remove o colaborador
      await colaboradorRepository.delete(parseInt(id, 10));
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca colaboradores por nome ou matrícula
   */
  buscarColaboradores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { termo } = req.query;
      
      if (!termo) {
        res.status(400).json({ error: 'Termo de busca é obrigatório' });
        return;
      }
      
      const colaboradores = await colaboradorRepository.findAll();
      
      // Filtra os colaboradores pelo termo de busca
      const resultado = colaboradores.filter(colaborador => 
        colaborador.nome.toLowerCase().includes((termo as string).toLowerCase()) || 
        colaborador.matricula.includes(termo as string)
      );
      
      res.status(200).json({
        total: resultado.length,
        colaboradores: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ColaboradorController(); 