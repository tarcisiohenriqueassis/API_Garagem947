const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const router = express.Router();

router.post("/gerar-pdf", async (req, res) => {
  const dados = req.body;

  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "orcamentoTemplate.pdf" // sem acento no nome do arquivo
    );

    if (!fs.existsSync(templatePath)) {
      return res.status(404).send("Template PDF não encontrado.");
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Data atual formatada
    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Mapeamento dos campos
    const fieldsMap = {
      Text1: (dados.cliente || "").toUpperCase(),
      Text2: dados.telefone || "",
      Text3: (dados.marca || "").toUpperCase(),
      Text4: (dados.modelo || "").toUpperCase(),
      Text5: dados.ano || "",
      Text6: (dados.veiculo || "").toUpperCase(),
      Text7: (dados.servicosLanternagem || ""),
      Text8: (dados.servicosPintura || ""),
      Text9: (dados.servicosMecanica || ""),
      Text10: (dados.valorTotal || ""),
      Text11: (dataHoje || ""),
    };

    // Preenche cada campo existente
    Object.entries(fieldsMap).forEach(([field, value]) => {
      try {
        form.getTextField(field).setText(value);
      } catch {
        console.warn(`Campo ${field} não encontrado no PDF`);
      }
    });

    // Bloquear edição
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    const nomeCliente = (dados.cliente || "cliente").replace(/\s+/g, "_").toUpperCase();
    const nomeArquivo = `${nomeCliente}_ORÇAMENTO.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${nomeArquivo}`
    );
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).send("Erro ao gerar PDF");
  }
});

module.exports = router;
