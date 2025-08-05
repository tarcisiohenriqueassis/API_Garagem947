const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const captalize = require("./utils/capitalizeletter");

app.post("/gerar-pdf-template", async (req, res) => {
  try {
    const dados = req.body;

    const pdfPath = path.join(__dirname, "templates", "orçamentoTemplate.pdf");
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).send("Template PDF não encontrado.");
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    fields.forEach((f) => console.log("Campo encontrado:", f.getName()));

    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const campos = {
      text_1: captalize(dados.cliente || ""),
      text_2: dados.telefone || "",
      text_3: captalize(dados.endereco || ""),
      text_4: captalize(dados.marca || ""),
      text_5: captalize(dados.modelo || ""),
      text_6: captalize(dados.ano || ""),
      text_7: captalize(dados.placa || ""),
      text_8: dataHoje,
      textarea_12qbhl: dados.servicosLanternagem || "",
      textarea_13nklh: dados.servicosPintura || "",
      textarea_14ndp: dados.servicosMecanica || "",
      text_20: dados.cpf || "",
      text_55cgcr: dados.valorTotal || "",
    };

    // Preenche os campos usando a API oficial
    Object.entries(campos).forEach(([campo, valor]) => {
      try {
        const field = form.getTextField(campo);
        field.setText(valor);
        console.log(`✅ Campo ${campo} preenchido com: ${valor}`);
      } catch (err) {
        console.warn(`⚠️ Campo "${campo}" não encontrado ou inválido.`);
      }
    });

    form.flatten(); // Torna os campos não editáveis

    const pdfBytes = await pdfDoc.save();
    const nomeCliente = (dados.cliente || "cliente").replace(/\s+/g, "_").toUpperCase();
    const nomeArquivo = `${nomeCliente}_ORÇAMENTO.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${nomeArquivo}`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).send("Erro ao gerar PDF");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
