import prisma from '../prisma/client';
import { Colaborador } from '../infrastructure/types';

/**
 * Repositório para operações relacionadas a colaboradores
 */
class ColaboradorRepository {
  /**
   * Busca todos os colaboradores
   * @returns Lista de colaboradores
   */
  async findAll(): Promise<Colaborador[]> {
    return prisma.colaborador.findMany({
      orderBy: {
        nome: 'asc'
      }
    });
  }

  /**
   * Busca um colaborador por ID
   * @param id ID do colaborador
   * @returns Colaborador encontrado ou null
   */
  async findById(id: number): Promise<Colaborador | null> {
    return prisma.colaborador.findUnique({
      where: { id }
    });
  }

  /**
   * Busca um colaborador por matrícula
   * @param matricula Matrícula do colaborador
   * @returns Colaborador encontrado ou null
   */
  async findByMatricula(matricula: string): Promise<Colaborador | null> {
    return prisma.colaborador.findUnique({
      where: { matricula }
    });
  }

  /**
   * Cria um novo colaborador
   * @param data Dados do colaborador
   * @returns Colaborador criado
   */
  async create(data: Omit<Colaborador, 'id' | 'createdAt' | 'updatedAt'>): Promise<Colaborador> {
    return prisma.colaborador.create({
      data
    });
  }

  /**
   * Atualiza um colaborador existente
   * @param id ID do colaborador
   * @param data Dados para atualização
   * @returns Colaborador atualizado
   */
  async update(id: number, data: Partial<Omit<Colaborador, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Colaborador> {
    return prisma.colaborador.update({
      where: { id },
      data
    });
  }

  /**
   * Remove um colaborador
   * @param id ID do colaborador
   * @returns Colaborador removido
   */
  async delete(id: number): Promise<Colaborador> {
    return prisma.colaborador.delete({
      where: { id }
    });
  }

  /**
   * Cria ou atualiza um colaborador com base na matrícula
   * @param data Dados do colaborador
   * @returns Colaborador criado ou atualizado
   */
  async createOrUpdate(data: Omit<Colaborador, 'id' | 'createdAt' | 'updatedAt'>): Promise<Colaborador> {
    const { matricula, nome } = data;
    
    const colaborador = await this.findByMatricula(matricula);
    
    if (colaborador) {
      return this.update(colaborador.id, { nome });
    } else {
      return this.create({ matricula, nome });
    }
  }
}

export default new ColaboradorRepository(); 