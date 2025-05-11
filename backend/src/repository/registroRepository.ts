import prisma from '../prisma/client';
import { Registro, RegistroExtracted, BatidaExtracted } from '../infrastructure/types';
import { PrismaClient } from '@prisma/client';

/**
 * Repositório para operações relacionadas a registros de ponto
 */
class RegistroRepository {
  /**
   * Busca todos os registros
   * @param filtros Filtros opcionais
   * @returns Lista de registros
   */
  async findAll(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    colaboradorId?: number;
    falta?: boolean;
  }): Promise<Registro[]> {
    const where: any = {};
    
    if (filtros?.dataInicio && filtros?.dataFim) {
      where.data = {
        gte: filtros.dataInicio,
        lte: filtros.dataFim
      };
    } else if (filtros?.dataInicio) {
      where.data = { gte: filtros.dataInicio };
    } else if (filtros?.dataFim) {
      where.data = { lte: filtros.dataFim };
    }
    
    if (filtros?.colaboradorId) {
      where.colaboradorId = filtros.colaboradorId;
    }
    
    if (filtros?.falta !== undefined) {
      where.falta = filtros.falta;
    }
    
    return prisma.registro.findMany({
      where,
      include: {
        colaborador: true,
        batidas: true
      },
      orderBy: [
        { data: 'desc' },
        { colaborador: { nome: 'asc' } }
      ]
    });
  }

  /**
   * Busca um registro por ID
   * @param id ID do registro
   * @returns Registro encontrado ou null
   */
  async findById(id: number): Promise<Registro | null> {
    return prisma.registro.findUnique({
      where: { id },
      include: {
        colaborador: true,
        batidas: true
      }
    });
  }

  /**
   * Busca um registro por data e colaborador
   * @param data Data do registro
   * @param colaboradorId ID do colaborador
   * @returns Registro encontrado ou null
   */
  async findByDataColaborador(data: Date, colaboradorId: number): Promise<Registro | null> {
    return prisma.registro.findUnique({
      where: {
        data_colaboradorId: {
          data,
          colaboradorId
        }
      },
      include: {
        colaborador: true,
        batidas: true
      }
    });
  }

  /**
   * Cria um novo registro
   * @param data Dados do registro
   * @param batidas Batidas associadas ao registro
   * @returns Registro criado
   */
  async create(
    data: Omit<Registro, 'id' | 'createdAt' | 'updatedAt' | 'batidas'>,
    batidas: Omit<BatidaExtracted, 'id' | 'createdAt' | 'updatedAt' | 'registroId'>[]
  ): Promise<Registro> {
    return prisma.registro.create({
      data: {
        ...data,
        batidas: {
          create: batidas.map(batida => ({
            horario: batida.horario,
            tipo: batida.tipo
          }))
        }
      },
      include: {
        colaborador: true,
        batidas: true
      }
    });
  }

  /**
   * Atualiza um registro existente
   * @param id ID do registro
   * @param data Dados para atualização
   * @returns Registro atualizado
   */
  async update(
    id: number,
    data: Partial<Omit<Registro, 'id' | 'createdAt' | 'updatedAt' | 'batidas'>>,
  ): Promise<Registro> {
    return prisma.registro.update({
      where: { id },
      data,
      include: {
        colaborador: true,
        batidas: true
      }
    });
  }

  /**
   * Remove um registro
   * @param id ID do registro
   * @returns Registro removido
   */
  async delete(id: number): Promise<Registro> {
    return prisma.registro.delete({
      where: { id },
      include: {
        colaborador: true,
        batidas: true
      }
    });
  }

  /**
   * Cria ou atualiza um registro com base na data e colaborador
   * @param data Dados do registro extraído
   * @param colaboradorId ID do colaborador
   * @returns Registro criado ou atualizado
   */
  async createOrUpdate(data: RegistroExtracted, colaboradorId: number): Promise<Registro> {
    const { data: dataRegistro, batidas, falta, atrasoMinutos, extraMinutos } = data;
    
    // Formata a data para evitar problemas com horários
    const dataFormatada = new Date(dataRegistro);
    dataFormatada.setHours(0, 0, 0, 0);
    
    try {
      // Verifica se já existe o registro
      const registroExistente = await this.findByDataColaborador(dataFormatada, colaboradorId);
      
      if (registroExistente) {
        // Atualiza o registro existente
        const registroAtualizado = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
          // Exclui todas as batidas existentes
          await tx.batida.deleteMany({
            where: { registroId: registroExistente.id }
          });
          
          // Atualiza o registro
          const registro = await tx.registro.update({
            where: { id: registroExistente.id },
            data: {
              falta,
              atrasoMinutos,
              extraMinutos,
              batidas: {
                create: batidas.map(batida => ({
                  horario: batida.horario,
                  tipo: batida.tipo
                }))
              }
            },
            include: {
              colaborador: true,
              batidas: true
            }
          });
          
          return registro;
        });
        
        return registroAtualizado;
      } else {
        // Cria um novo registro
        return this.create(
          {
            data: dataFormatada,
            colaboradorId,
            falta,
            atrasoMinutos,
            extraMinutos
          },
          batidas
        );
      }
    } catch (error) {
      console.error('Erro ao criar ou atualizar registro:', error);
      throw new Error(`Falha ao processar registro: ${(error as Error).message}`);
    }
  }
}

export default new RegistroRepository(); 