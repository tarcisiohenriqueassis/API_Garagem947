const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const router = express.Router();

const captalize = require("./utils/captalize");

router.post("/gerar-pdf", async (req, res) => {
  const dados = req.body;

  try {
    const templatePath = path.join(__dirname, "templates", "orçamentoGaragem497.pdf");

    if (!fs.existsSync(templatePath)) {
      return res.status(404).send("Template PDF não encontrado.");
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    fields.forEach((f) => console.log("Campo encontrado:", f.getName()));

    const dataHoje = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const fieldsMap = {
     text_1_nome: captalize(dados.cliente || ""),
          text_2_telefone: dados.telefone || "",
          text_3_cpf: dados.cpf || "",
          text_4_endereco: captalize(dados.endereco || ""),
          text_5_marca: captalize(dados.marca || ""),
          text_6_modelo: captalize(dados.modelo || ""),
          text_7_ano: captalize(dados.ano || ""),
          text_8_placa: captalize(dados.placa || ""),
          text_13_data: dataHoje,
          textarea_9_lanternagem: dados.servicosLanternagem || "",
          textarea_10_pintura: dados.servicosPintura || "",
          textarea_11_mecanica: dados.servicosMecanica || "",
          textarea_12_pecas: dados.pecas || "",
          text_14_valor: dados.valorTotal || "",
    };
 
    Object.entries(fieldsMap).forEach(([nomeCampo, valor]) => {
      try {
        const campo = form.getTextField(nomeCampo);
        campo.setText(valor);
      } catch (err) {
        console.warn(`Campo "${nomeCampo}" não encontrado ou inválido.`);
      }
    });

    // Flatten os campos para impedir edição
     form.flatten();

    const pdfBytes = await pdfDoc.save();
    const nomeCliente = (dados.cliente || "cliente").replace(/\s+/g, "_").toUpperCase();
    const nomeArquivo = `${nomeCliente}_ORÇAMENTO.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${nomeArquivo}`);
    res.send(pdfBytes);

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).send("Erro ao gerar PDF");
  }
});

module.exports = router;
