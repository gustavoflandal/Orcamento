-- Script de inserção de dados de exemplo para teste
-- Data: 13 de agosto de 2025
-- Descrição: Dados de exemplo para testar o sistema

USE orcamento;

-- Inserir usuário de teste
INSERT INTO usuarios (login, senha) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- senha: password

-- Obter ID do usuário criado
SET @user_id = LAST_INSERT_ID();

-- Inserir categorias para o usuário de teste
INSERT INTO categorias (nome, tipo, cor, id_usuario) VALUES 
('Alimentação', 'Débito', '#e74c3c', @user_id),
('Transporte', 'Débito', '#f39c12', @user_id),
('Moradia', 'Débito', '#9b59b6', @user_id),
('Salário', 'Crédito', '#27ae60', @user_id),
('Freelance', 'Crédito', '#16a085', @user_id);

-- Atualizar para que cada categoria seja própria categoria pai
UPDATE categorias SET id_categoria_pai = id WHERE id_usuario = @user_id;

-- Obter IDs das categorias
SET @cat_alimentacao = (SELECT id FROM categorias WHERE nome = 'Alimentação' AND id_usuario = @user_id);
SET @cat_moradia = (SELECT id FROM categorias WHERE nome = 'Moradia' AND id_usuario = @user_id);
SET @cat_salario = (SELECT id FROM categorias WHERE nome = 'Salário' AND id_usuario = @user_id);

-- Inserir despesa recorrente de exemplo
INSERT INTO despesas_recorrentes (descricao, valor_total, numero_parcelas, primeiro_vencimento, periodo, id_categoria, id_usuario) VALUES 
('Aluguel Apartamento', 1200.00, 12, '2025-08-15', 30, @cat_moradia, @user_id),
('Supermercado Mensal', 600.00, 6, '2025-08-20', 30, @cat_alimentacao, @user_id);

-- Obter IDs das despesas recorrentes
SET @desp_aluguel = (SELECT id FROM despesas_recorrentes WHERE descricao = 'Aluguel Apartamento' AND id_usuario = @user_id);
SET @desp_super = (SELECT id FROM despesas_recorrentes WHERE descricao = 'Supermercado Mensal' AND id_usuario = @user_id);

-- Inserir parcelas para o aluguel (12 parcelas de R$ 100,00)
INSERT INTO parcelas (id_despesa_recorrente, numero_parcela, data_vencimento, valor) VALUES 
(@desp_aluguel, 1, '2025-08-15', 100.00),
(@desp_aluguel, 2, '2025-09-14', 100.00),
(@desp_aluguel, 3, '2025-10-14', 100.00),
(@desp_aluguel, 4, '2025-11-13', 100.00),
(@desp_aluguel, 5, '2025-12-13', 100.00),
(@desp_aluguel, 6, '2026-01-12', 100.00);

-- Inserir parcelas para o supermercado (6 parcelas de R$ 100,00)
INSERT INTO parcelas (id_despesa_recorrente, numero_parcela, data_vencimento, valor) VALUES 
(@desp_super, 1, '2025-08-20', 100.00),
(@desp_super, 2, '2025-09-19', 100.00),
(@desp_super, 3, '2025-10-19', 100.00),
(@desp_super, 4, '2025-11-18', 100.00);

-- Inserir algumas operações manuais
INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario, status) VALUES 
('2025-08-01', 'Salário Agosto', @cat_salario, 3000.00, @user_id, 'Pago'),
('2025-08-05', 'Combustível', (SELECT id FROM categorias WHERE nome = 'Transporte' AND id_usuario = @user_id), 150.00, @user_id, 'Pago'),
('2025-08-10', 'Almoço Restaurante', @cat_alimentacao, 45.00, @user_id, 'Pago');

-- Importar algumas parcelas como operações (simulando import)
INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario, status, id_parcela) VALUES 
('2025-08-15', 'Parcela 1 - Aluguel Apartamento', @cat_moradia, 100.00, @user_id, 'Aberto', 
  (SELECT id FROM parcelas WHERE id_despesa_recorrente = @desp_aluguel AND numero_parcela = 1)),
('2025-08-20', 'Parcela 1 - Supermercado Mensal', @cat_alimentacao, 100.00, @user_id, 'Pago',
  (SELECT id FROM parcelas WHERE id_despesa_recorrente = @desp_super AND numero_parcela = 1));

-- Atualizar status da parcela paga
UPDATE parcelas SET status = 'Pago' 
WHERE id_despesa_recorrente = @desp_super AND numero_parcela = 1;

-- Exibir dados inseridos
SELECT 'Dados de exemplo inseridos com sucesso!' as resultado;

SELECT 'USUÁRIOS' as tabela;
SELECT * FROM usuarios WHERE id = @user_id;

SELECT 'CATEGORIAS' as tabela;
SELECT * FROM categorias WHERE id_usuario = @user_id;

SELECT 'DESPESAS RECORRENTES' as tabela;
SELECT * FROM despesas_recorrentes WHERE id_usuario = @user_id;

SELECT 'PARCELAS' as tabela;
SELECT p.*, dr.descricao as despesa_descricao 
FROM parcelas p 
JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id 
WHERE dr.id_usuario = @user_id;

SELECT 'OPERAÇÕES' as tabela;
SELECT o.*, c.nome as categoria_nome 
FROM operacoes o 
JOIN categorias c ON o.id_categoria = c.id 
WHERE o.id_usuario = @user_id;
