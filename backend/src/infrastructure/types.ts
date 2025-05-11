// Interface para upload de arquivos
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Tipo para os tipos de batida
export type TipoBatida = 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA';

// Interface para os resultados do OCR
export interface OcrResult {
  text: string;
  confidence: number;
}

// Interface para os dados extraídos de um colaborador
export interface ColaboradorExtracted {
  matricula: string;
  nome: string;
}

// Interface para uma batida extraída
export interface BatidaExtracted {
  horario: Date;
  tipo: TipoBatida;
}

// Interface para um registro de ponto extraído
export interface RegistroExtracted {
  data: Date;
  colaborador: ColaboradorExtracted;
  batidas: BatidaExtracted[];
  falta: boolean;
  atrasoMinutos: number;
  extraMinutos: number;
}

// Interface para entidades do banco de dados
export interface Colaborador {
  id: number;
  matricula: string;
  nome: string;
  createdAt: Date;
  updatedAt: Date;
  registros?: Registro[];
}

export interface Registro {
  id: number;
  data: Date;
  colaboradorId: number;
  falta: boolean;
  atrasoMinutos: number;
  extraMinutos: number;
  createdAt: Date;
  updatedAt: Date;
  colaborador?: Colaborador;
  batidas?: Batida[];
}

export interface Batida {
  id: number;
  registroId: number;
  horario: Date;
  tipo: string;
  createdAt: Date;
  updatedAt: Date;
  registro?: Registro;
}

export interface ArquivoProcessado {
  id: number;
  nome: string;
  caminho: string;
  tamanho: number;
  hash: string;
  processado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para o resultado do processamento de um arquivo
export interface ProcessamentoResult {
  arquivo: Omit<ArquivoProcessado, 'id' | 'createdAt' | 'updatedAt'>;
  registros: RegistroExtracted[];
  totalProcessados: number;
  erros: string[];
}

// Interface para as opções do serviço de OCR
export interface OcrOptions {
  lang?: string;
  oem?: number;
  psm?: number;
}

// Interface para erros da API
export interface ApiError extends Error {
  statusCode: number;
  details?: any;
} 