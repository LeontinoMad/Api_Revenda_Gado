import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const propostas = await prisma.proposta.findMany({
      include: {
        cliente: true,
        gado: true,
      },
    });
    res.status(200).json(propostas);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", async (req, res) => {
  const { clienteId, gadoId, descricao } = req.body;

  if (!clienteId || !gadoId || !descricao) {
    res.status(400).json({ erro: "Informe clienteId, gadoId e descricao" });
    return;
  }

  try {
    const proposta = await prisma.proposta.create({
      data: { clienteId, gadoId, descricao },
    });
    res.status(201).json(proposta);
  } catch (error) {
    res.status(400).json(error);
  }
});

async function enviaEmail(
  nome: string,
  email: string,
  descricao: string,
  resposta: string
) {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: "7d4b50001@smtp-brevo.com",
      pass: "ZW0295BMVamtbKTr",
    },
  });

  const info = await transporter.sendMail({
    from: "leontinomadruga@gmail.com", // sender address
    to: email, // list of receivers
    subject: "Re: Proposta Revenda de gado", // Subject line
    text: resposta, // plain text body
    html: `<h3>Meu amigo Cliente: ${nome}</h3>
           <h3>Proposta: ${descricao}</h3>
           <h3>Resposta da Revenda: ${resposta}</h3>
           <p>Muito obrigado pelo seu contato</p>
           <p>Revenda de Gado Biduca.</p>`,
  });

  console.log("Message sent: %s", info.messageId);
}

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { resposta } = req.body;

  if (!resposta) {
    res.status(400).json({ erro: "Informe a resposta desta proposta" });
    return;
  }

  try {
    const proposta = await prisma.proposta.update({
      where: { id: Number(id) },
      data: { resposta },
    });

    const dados = await prisma.proposta.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
      },
    });

    enviaEmail(
      dados?.cliente.nome as string,
      dados?.cliente.email as string,
      dados?.descricao as string,
      resposta
    );

    res.status(200).json(proposta);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const propostas = await prisma.proposta.findMany({
      where: { clienteId },
      include: {
        gado: true,
      },
    });
    res.status(200).json(propostas);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
