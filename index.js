const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Função auxiliar para definir o texto de um campo no PDF
function trySetField(form, name, value, multiline = false) {
  try {
    const field = form.getTextField(name);
    field.setText(value || "");

    if (multiline) {
      // Ativar multiline no campo (flag 4096)
      const acroField = field.acroField;
      acroField.setFlags((acroField.getFlags() || 0) | 4096);
    }
  } catch (e) {
    console.warn(`Campo "${name}" não encontrado no PDF.`);
  }
}


// Rota para gerar PDF
app.post("/gerar-pdf-template", async (req, res) => {
  try {
    const dados = req.body;

    const pdfPath = path.join(__dirname, "templates", "orcamentoTemplate.pdf");
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).send("Template PDF não encontrado.");
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Log de campos existentes
    //const fields = form.getFields();
    //fields.forEach((f) => console.log("Campo encontrado:", f.getName()));

    // Data atual por extenso
    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

   // Preencher campos reais do PDF
      trySetField(form, "Text1", (dados.cliente || "").toUpperCase());
      trySetField(form, "Text5", dados.telefone || "");
      trySetField(form, "Text3", (dados.marca || ""));
      trySetField(form, "Text2", (dados.modelo || "").toUpperCase());
      trySetField(form, "Text12", dados.placa || "").toUpperCase();
      trySetField(form, "Text4", dados.ano || "");
      trySetField(form, "Text6", (dados.veiculo || ""));
      trySetField(form, "Text7", dados.servicosLanternagem || "", true);
      trySetField(form, "Text8", dados.servicosPintura || "", true);
      trySetField(form, "Text9", dados.servicosMecanica || "", true);
      trySetField(form, "Text11", (dados.valorTotal || ""));
      trySetField(form, "Text10", dataHoje);

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

  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).send("Erro ao gerar PDF");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
