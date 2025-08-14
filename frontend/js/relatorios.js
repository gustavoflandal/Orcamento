// relatorios.js
// Utilitário para geração de relatórios em PDF

// Função para gerar relatório de operações
function gerarRelatorioOperacoes() {
  console.log('Função gerarRelatorioOperacoes chamada');
  console.log('window.jsPDF disponível:', typeof window.jsPDF);
  console.log('window.jspdf disponível:', typeof window.jspdf);
  
  try {
    // Verificar se jsPDF está disponível (diferentes formas de carregamento)
    let jsPDF;
    if (typeof window.jsPDF !== 'undefined') {
      jsPDF = window.jsPDF.jsPDF || window.jsPDF;
      console.log('Usando window.jsPDF');
    } else if (typeof window.jspdf !== 'undefined') {
      jsPDF = window.jspdf.jsPDF || window.jspdf;
      console.log('Usando window.jspdf');
    } else if (typeof jsPDF !== 'undefined') {
      // jsPDF global
      console.log('Usando jsPDF global');
    } else {
      console.error('jsPDF não está disponível em nenhuma forma');
      showToast('Biblioteca PDF não carregada. Recarregue a página.', 'erro');
      return;
    }

    console.log('jsPDF carregado com sucesso', typeof jsPDF);
    const doc = new jsPDF();
    
    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Orçamento Doméstico', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    doc.setFontSize(14);
    doc.text('Relatório de Operações', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 20;

    // Obter dados da tabela
    const tabela = document.querySelector('.operacoes-table tbody');
    if (!tabela || tabela.children.length === 0) {
      showToast('Não há dados para gerar o relatório.', 'erro');
      return;
    }

    // Cabeçalhos da tabela
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Saldo', 'Status'];
    
    // Configurar tabela
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Larguras das colunas (ajustadas para caber na página)
    const colWidths = [20, 45, 30, 15, 25, 25, 20];
    let startX = margin;
    
    // Desenhar cabeçalhos
    headers.forEach((header, index) => {
      doc.text(header, startX, currentY);
      startX += colWidths[index];
    });
    
    currentY += 7;
    
    // Linha separadora
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    
    Array.from(tabela.children).forEach((row) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }

      const cells = row.children;
      startX = margin;
      
      // Extrair dados das células (exceto a última coluna de ações)
      for (let i = 0; i < Math.min(cells.length - 1, headers.length); i++) {
        let cellText = cells[i].textContent.trim();
        
        // Processar status (checkbox)
        if (i === 6) { // Coluna de status
          const checkbox = cells[i].querySelector('input[type="checkbox"]');
          cellText = checkbox && checkbox.checked ? 'Pago' : 'Aberto';
        }
        
        // Truncar texto se muito longo
        if (cellText.length > 15 && i === 1) { // Descrição
          cellText = cellText.substring(0, 15) + '...';
        }
        
        doc.text(cellText, startX, currentY);
        startX += colWidths[i];
      }
      
      currentY += 6;
    });

    // Rodapé
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Salvar o PDF
    const nomeArquivo = `operacoes_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(nomeArquivo);
    
    showToast('Relatório gerado com sucesso!', 'sucesso');
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    showToast('Erro ao gerar relatório PDF.', 'erro');
  }
}

// Função para gerar relatório de despesas recorrentes
function gerarRelatorioDespesas() {
  console.log('Função gerarRelatorioDespesas chamada');
  console.log('window.jsPDF disponível:', typeof window.jsPDF);
  console.log('window.jspdf disponível:', typeof window.jspdf);
  
  try {
    // Verificar se jsPDF está disponível (diferentes formas de carregamento)
    let jsPDF;
    if (typeof window.jsPDF !== 'undefined') {
      jsPDF = window.jsPDF.jsPDF || window.jsPDF;
      console.log('Usando window.jsPDF');
    } else if (typeof window.jspdf !== 'undefined') {
      jsPDF = window.jspdf.jsPDF || window.jspdf;
      console.log('Usando window.jspdf');
    } else if (typeof jsPDF !== 'undefined') {
      // jsPDF global
      console.log('Usando jsPDF global');
    } else {
      console.error('jsPDF não está disponível em nenhuma forma');
      showToast('Biblioteca PDF não carregada. Recarregue a página.', 'erro');
      return;
    }

    console.log('jsPDF carregado com sucesso', typeof jsPDF);
    const doc = new jsPDF();
    
    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Orçamento Doméstico', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    doc.setFontSize(14);
    doc.text('Relatório de Despesas Recorrentes', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 20;

    // Obter dados da tabela
    const tabela = document.querySelector('.despesas-table tbody');
    if (!tabela || tabela.children.length === 0) {
      showToast('Não há dados para gerar o relatório.', 'erro');
      return;
    }

    // Cabeçalhos da tabela
    const headers = ['Descrição', 'Valor Total', 'Parcelas', '1º Vencimento', 'Dias Intervalo', 'Categoria', 'Saldo a Pagar'];
    
    // Configurar tabela
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    // Larguras das colunas (ajustadas para caber na página)
    const colWidths = [35, 20, 15, 20, 20, 25, 25];
    let startX = margin;
    
    // Desenhar cabeçalhos
    headers.forEach((header, index) => {
      doc.text(header, startX, currentY);
      startX += colWidths[index];
    });
    
    currentY += 7;
    
    // Linha separadora
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    
    Array.from(tabela.children).forEach((row) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }

      const cells = row.children;
      startX = margin;
      
      // Extrair dados das células (exceto a última coluna de ações)
      for (let i = 0; i < Math.min(cells.length - 1, headers.length); i++) {
        let cellText = cells[i].textContent.trim();
        
        // Truncar texto se muito longo
        if (cellText.length > 20 && i === 0) { // Descrição
          cellText = cellText.substring(0, 20) + '...';
        }
        if (cellText.length > 15 && i === 5) { // Categoria
          cellText = cellText.substring(0, 15) + '...';
        }
        
        doc.text(cellText, startX, currentY);
        startX += colWidths[i];
      }
      
      currentY += 6;
    });

    // Rodapé
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Salvar o PDF
    const nomeArquivo = `despesas_recorrentes_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(nomeArquivo);
    
    showToast('Relatório gerado com sucesso!', 'sucesso');
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    showToast('Erro ao gerar relatório PDF.', 'erro');
  }
}

// Função utilitária para formatar valores monetários para exibição
function formatarValorRelatorio(valor) {
  if (typeof valor === 'string' && valor.includes('R$')) {
    return valor;
  }
  return Number(valor).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}
