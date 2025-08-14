-- Script simples para adicionar campo id_parcela na tabela operacoes
-- Este script pode ser executado em bancos existentes
-- Data: 13 de agosto de 2025

USE orcamento;

-- Adicionar coluna id_parcela se não existir
ALTER TABLE operacoes 
ADD COLUMN id_parcela INT NULL 
COMMENT 'Vincula operação a uma parcela específica';

-- Adicionar foreign key
ALTER TABLE operacoes 
ADD CONSTRAINT fk_operacoes_parcela 
FOREIGN KEY (id_parcela) REFERENCES parcelas(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Adicionar índice para melhor performance
CREATE INDEX idx_operacoes_parcela ON operacoes(id_parcela);

-- Verificar estrutura da tabela
SELECT 'Campo id_parcela adicionado com sucesso!' as resultado;
