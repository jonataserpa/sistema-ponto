const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingRecords() {
    try {
        console.log('🔍 Verificando registros existentes para 05/05/25...\n');
        
        // Converter data para formato ISO
        const data = new Date('2025-05-05');
        
        // Buscar registros existentes
        const registrosExistentes = await prisma.registro.findMany({
            where: {
                data: data
            },
            include: {
                colaborador: {
                    select: {
                        matricula: true,
                        nome: true
                    }
                }
            },
            orderBy: {
                colaborador: {
                    matricula: 'asc'
                }
            }
        });
        
        console.log(`📊 Total de registros existentes: ${registrosExistentes.length}\n`);
        
        if (registrosExistentes.length > 0) {
            console.log('📋 Primeiros 10 registros existentes:');
            registrosExistentes.slice(0, 10).forEach((registro, index) => {
                console.log(`${index + 1}. Matrícula: ${registro.colaborador.matricula} - Nome: ${registro.colaborador.nome}`);
            });
            
            if (registrosExistentes.length > 10) {
                console.log(`... e mais ${registrosExistentes.length - 10} registros`);
            }
        }
        
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar registros:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkExistingRecords(); 