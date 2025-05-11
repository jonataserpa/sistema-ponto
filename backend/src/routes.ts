import express from 'express';
import uploadController from './controller/uploadController';
import registroController from './controller/registroController';
import colaboradorController from './controller/colaboradorController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Upload
 *     description: Endpoints para upload e processamento de PDFs
 *   - name: Colaboradores
 *     description: Endpoints para gerenciamento de colaboradores
 *   - name: Registros
 *     description: Endpoints para consulta de registros de ponto
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Envia e processa um arquivo PDF de espelho de ponto
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Arquivo processado com sucesso
 *       400:
 *         description: Parâmetros inválidos ou erro no upload
 *       500:
 *         description: Erro no servidor
 */
router.post('/upload', uploadController.uploadPdf);

/**
 * @swagger
 * /api/colaboradores:
 *   get:
 *     summary: Lista todos os colaboradores
 *     tags: [Colaboradores]
 *     responses:
 *       200:
 *         description: Lista de colaboradores
 *       500:
 *         description: Erro no servidor
 */
router.get('/colaboradores', colaboradorController.listarColaboradores);

/**
 * @swagger
 * /api/colaboradores/busca:
 *   get:
 *     summary: Busca colaboradores por nome ou matrícula
 *     tags: [Colaboradores]
 *     parameters:
 *       - in: query
 *         name: termo
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultado da busca
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro no servidor
 */
router.get('/colaboradores/busca', colaboradorController.buscarColaboradores);

/**
 * @swagger
 * /api/colaboradores/{id}:
 *   get:
 *     summary: Obtém um colaborador pelo ID
 *     tags: [Colaboradores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do colaborador
 *     responses:
 *       200:
 *         description: Colaborador encontrado
 *       404:
 *         description: Colaborador não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/colaboradores/:id', colaboradorController.obterColaborador);

/**
 * @swagger
 * /api/colaboradores:
 *   post:
 *     summary: Cria um novo colaborador
 *     tags: [Colaboradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matricula:
 *                 type: string
 *               nome:
 *                 type: string
 *     responses:
 *       201:
 *         description: Colaborador criado com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       409:
 *         description: Colaborador com esta matrícula já existe
 *       500:
 *         description: Erro no servidor
 */
router.post('/colaboradores', colaboradorController.criarColaborador);

/**
 * @swagger
 * /api/colaboradores/{id}:
 *   put:
 *     summary: Atualiza um colaborador
 *     tags: [Colaboradores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do colaborador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Colaborador atualizado com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Colaborador não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.put('/colaboradores/:id', colaboradorController.atualizarColaborador);

/**
 * @swagger
 * /api/colaboradores/{id}:
 *   delete:
 *     summary: Remove um colaborador
 *     tags: [Colaboradores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do colaborador
 *     responses:
 *       204:
 *         description: Colaborador removido com sucesso
 *       404:
 *         description: Colaborador não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.delete('/colaboradores/:id', colaboradorController.removerColaborador);

/**
 * @swagger
 * /api/registros:
 *   get:
 *     summary: Lista todos os registros de ponto
 *     tags: [Registros]
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *       - in: query
 *         name: colaboradorId
 *         schema:
 *           type: integer
 *         description: ID do colaborador para filtro
 *       - in: query
 *         name: falta
 *         schema:
 *           type: boolean
 *         description: Filtrar por faltas
 *     responses:
 *       200:
 *         description: Lista de registros
 *       500:
 *         description: Erro no servidor
 */
router.get('/registros', registroController.listarRegistros);

/**
 * @swagger
 * /api/registros/{id}:
 *   get:
 *     summary: Obtém um registro pelo ID
 *     tags: [Registros]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do registro
 *     responses:
 *       200:
 *         description: Registro encontrado
 *       404:
 *         description: Registro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/registros/:id', registroController.obterRegistro);

/**
 * @swagger
 * /api/colaboradores/{colaboradorId}/registros:
 *   get:
 *     summary: Lista registros de um colaborador específico
 *     tags: [Registros]
 *     parameters:
 *       - in: path
 *         name: colaboradorId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do colaborador
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *     responses:
 *       200:
 *         description: Lista de registros do colaborador
 *       500:
 *         description: Erro no servidor
 */
router.get('/colaboradores/:colaboradorId/registros', registroController.obterRegistrosPorColaborador);

/**
 * @swagger
 * /api/registros/estatisticas:
 *   get:
 *     summary: Obtém estatísticas dos registros
 *     tags: [Registros]
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *     responses:
 *       200:
 *         description: Estatísticas dos registros
 *       500:
 *         description: Erro no servidor
 */
router.get('/registros/estatisticas', registroController.obterEstatisticas);

export default router; 