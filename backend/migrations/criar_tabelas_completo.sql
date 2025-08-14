-- Script completo de criação das tabelas do banco de dados Orçamento
-- Data: 13 de agosto de 2025
-- Descrição: Sistema de orçamento doméstico com despesas recorrentes e operações

-- Criar database se não existir
CREATE DATABASE IF NOT EXISTS orcamento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE orcamento;

-- Tabela de usuários
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de categorias
DROP TABLE IF EXISTS categorias;
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('Crédito', 'Débito') NOT NULL,
    cor VARCHAR(7) DEFAULT '#3498db',
    id_categoria_pai INT NULL,
    id_usuario INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria_pai) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_categorias_usuario (id_usuario),
    INDEX idx_categorias_tipo (tipo)
) ENGINE=InnoDB;

-- Tabela de despesas recorrentes
DROP TABLE IF EXISTS despesas_recorrentes;
CREATE TABLE despesas_recorrentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    numero_parcelas INT NOT NULL,
    primeiro_vencimento DATE NOT NULL,
    periodo INT NOT NULL DEFAULT 30 COMMENT 'Dias entre parcelas',
    id_categoria INT NOT NULL,
    id_usuario INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_despesas_usuario (id_usuario),
    INDEX idx_despesas_categoria (id_categoria),
    INDEX idx_despesas_vencimento (primeiro_vencimento)
) ENGINE=InnoDB;

-- Tabela de parcelas (geradas automaticamente das despesas recorrentes)
DROP TABLE IF EXISTS parcelas;
CREATE TABLE parcelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_despesa_recorrente INT NOT NULL,
    numero_parcela INT NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('Aberto', 'Pago') DEFAULT 'Aberto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_despesa_recorrente) REFERENCES despesas_recorrentes(id) ON DELETE CASCADE,
    INDEX idx_parcelas_despesa (id_despesa_recorrente),
    INDEX idx_parcelas_vencimento (data_vencimento),
    INDEX idx_parcelas_status (status),
    UNIQUE KEY uk_parcela_numero (id_despesa_recorrente, numero_parcela)
) ENGINE=InnoDB;

-- Tabela de operações (movimentações financeiras)
DROP TABLE IF EXISTS operacoes;
CREATE TABLE operacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    id_categoria INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('Aberto', 'Pago') DEFAULT 'Aberto',
    id_usuario INT NOT NULL,
    id_parcela INT NULL COMMENT 'Vincula operação a uma parcela específica',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_parcela) REFERENCES parcelas(id) ON DELETE SET NULL,
    INDEX idx_operacoes_data (data),
    INDEX idx_operacoes_usuario (id_usuario),
    INDEX idx_operacoes_categoria (id_categoria),
    INDEX idx_operacoes_status (status),
    INDEX idx_operacoes_parcela (id_parcela)
) ENGINE=InnoDB;

-- Inserir categorias padrão para facilitar o uso inicial
-- Estas categorias serão inseridas apenas se não existirem usuários no sistema
INSERT IGNORE INTO usuarios (id, login, senha) VALUES (0, 'sistema', 'sistema_temp');

INSERT INTO categorias (nome, tipo, cor, id_categoria_pai, id_usuario) VALUES
('Alimentação', 'Débito', '#e74c3c', NULL, 0),
('Transporte', 'Débito', '#f39c12', NULL, 0),
('Moradia', 'Débito', '#9b59b6', NULL, 0),
('Saúde', 'Débito', '#1abc9c', NULL, 0),
('Educação', 'Débito', '#3498db', NULL, 0),
('Lazer', 'Débito', '#2ecc71', NULL, 0),
('Salário', 'Crédito', '#27ae60', NULL, 0),
('Freelance', 'Crédito', '#16a085', NULL, 0),
('Investimentos', 'Crédito', '#f1c40f', NULL, 0),
('Outros Créditos', 'Crédito', '#95a5a6', NULL, 0);

-- Atualizar as categorias para que sejam próprias categoria pai
UPDATE categorias SET id_categoria_pai = id WHERE id_usuario = 0;

-- Remover usuário temporário do sistema
DELETE FROM usuarios WHERE id = 0;

-- Exibir informações das tabelas criadas
SHOW TABLES;

SELECT 
    TABLE_NAME as 'Tabela',
    TABLE_ROWS as 'Registros',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Tamanho (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'orcamento'
ORDER BY TABLE_NAME;

-- Verificar constraints e índices
SELECT 
    TABLE_NAME as 'Tabela',
    CONSTRAINT_NAME as 'Constraint',
    CONSTRAINT_TYPE as 'Tipo'
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'orcamento'
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;

COMMIT;
