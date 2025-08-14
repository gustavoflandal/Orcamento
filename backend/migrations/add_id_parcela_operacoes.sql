-- Script para adicionar campo id_parcela na tabela operacoes
-- Este campo permite vincular operações às parcelas de despesas recorrentes

USE orcamento;

-- Verificar se a coluna já existe antes de adicioná-la
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE table_schema = 'orcamento' 
                  AND table_name = 'operacoes' 
                  AND column_name = 'id_parcela');

-- Adicionar coluna id_parcela na tabela operacoes se não existir
SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE operacoes ADD COLUMN id_parcela INT NULL', 
              'SELECT "Coluna id_parcela já existe" as info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar foreign key se não existir
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                 WHERE table_schema = 'orcamento' 
                 AND table_name = 'operacoes' 
                 AND constraint_name = 'fk_operacoes_parcela');

SET @sql = IF(@fk_exists = 0, 
              'ALTER TABLE operacoes ADD CONSTRAINT fk_operacoes_parcela FOREIGN KEY (id_parcela) REFERENCES parcelas(id) ON DELETE SET NULL ON UPDATE CASCADE', 
              'SELECT "Foreign key já existe" as info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Script executado com sucesso' as resultado;
