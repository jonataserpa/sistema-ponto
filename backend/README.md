# Sistema de Análise de Espelho de Ponto - Backend

API para processamento e análise de espelhos de ponto via OCR.

## Descrição

Este sistema recebe como entrada arquivos PDF contendo espelhos de ponto (folhas de ponto) e, por meio de OCR (Reconhecimento Óptico de Caracteres), extrai informações importantes para cada colaborador e para cada dia, como:

- Registro de batidas de ponto
- Identificação de faltas
- Cálculo de atraso
- Cálculo de hora extra

## Tecnologias Utilizadas

- Node.js + TypeScript
- Express.js para API REST
- Tesseract.js para OCR
- Prisma ORM para acesso ao banco de dados MariaDB
- Swagger para documentação interativa da API

## Pré-requisitos

- Node.js 18+ 
- MariaDB 10.5+
- [pdftoppm](https://poppler.freedesktop.org/) para conversão de PDF para imagens (necessário para OCR)

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd sistema-ponto/backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env` na raiz do projeto:
```
# Configuração do ambiente
NODE_ENV=development
PORT=3000

# Configuração do banco de dados
DATABASE_URL="mysql://root:password@localhost:3306/ponto_db"

# Configuração JWT
JWT_SECRET=sistema_ponto_secret_key
JWT_EXPIRATION=1h

# Configuração de upload de arquivos
MAX_FILE_SIZE=10485760 # 10MB em bytes
UPLOAD_DIR=./uploads
```

4. Crie o banco de dados e execute as migrações:
```bash
npx prisma migrate dev
```

## Executando a API

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## Documentação da API

A documentação interativa da API estará disponível em:

```
http://localhost:3000/api-docs
```

## Endpoints Principais

- `POST /api/upload` - Envia e processa um arquivo PDF de espelho de ponto
- `GET /api/colaboradores` - Lista todos os colaboradores
- `GET /api/registros` - Lista todos os registros de ponto (aceita filtros)
- `GET /api/registros/estatisticas` - Obtém estatísticas dos registros

## Estrutura do Projeto

```
backend/
├── src/
│   ├── controller/     # Controladores da API
│   ├── service/        # Serviços de lógica de negócio
│   ├── repository/     # Repositórios de acesso a dados
│   ├── infrastructure/ # Infraestrutura, configuração e utilitários
│   ├── prisma/         # Schema e cliente Prisma
│   ├── app.ts          # Configuração da aplicação Express
│   └── routes.ts       # Rotas da API
├── tests/              # Testes automatizados
└── uploads/            # Diretório para arquivos carregados
```

## Scripts Disponíveis

- `npm run build`: Compila TypeScript para JavaScript
- `npm start`: Inicia o servidor em produção
- `npm run dev`: Inicia o servidor em modo desenvolvimento com hot-reload
- `npm test`: Executa os testes
- `npm run lint`: Executa o linter
- `npm run prisma:generate`: Gera o cliente Prisma
- `npm run prisma:migrate`: Executa migrações do Prisma
- `npm run prisma:studio`: Inicia o Prisma Studio (interface visual para o banco)

## Licença

[ISC](LICENSE) 