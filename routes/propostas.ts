import { PrismaClient } from "@prisma/client";
import { Router } from "express";
// import nodemailer from "nodemailer"; // Não precisamos mais se não vamos enviar email

const prisma = new PrismaClient();
const router = Router();

// Rota para listar todas as propostas com dados do cliente e gado
router.get("/", async (req, res) => {
  try {
    const propostas = await prisma.proposta.findMany({
      include: {
        cliente: {
          select: {
            // Seleciona apenas os campos necessários do cliente
            id: true,
            nome: true,
            cpf: true,
            telefone: true, // Inclui o telefone para possível uso com WhatsApp
          },
        },
        gado: true,
      },
    });
    res.status(200).json(propostas);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para criar uma nova proposta
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

// Função para enviar e-mail (REMOVIDA OU ADAPTADA)
// Se você não tem mais 'email' no modelo Cliente, essa função não pode ser usada como está.
// Caso você queira implementar envio de mensagem via WhatsApp, o código seria diferente.
/*
async function enviaMensagemWhatsApp(
  nome: string,
  telefone: string, // Agora usa o telefone
  descricao: string,
  resposta: string
) {
  // Aqui você faria a integração com uma API de WhatsApp (ex: Twilio, MessageBird, etc.)
  // Isso requer uma conta em uma dessas plataformas e as credenciais.
  // Exemplo hipotético (apenas para ilustrar a ideia):
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // client.messages.create({
  //   body: `Olá ${nome}, sobre sua proposta "${descricao}", a resposta é: "${resposta}".`,
  //   from: 'whatsapp:+14155238886', // Seu número de WhatsApp Business da Twilio
  //   to: `whatsapp:${telefone}` // Telefone do cliente com +DDI
  // })
  // .then(message => console.log(message.sid))
  // .catch(error => console.error(error));

  console.log(`Simulação de envio de mensagem WhatsApp para ${telefone} (${nome}):`);
  console.log(`Proposta: "${descricao}"`);
  console.log(`Resposta: "${resposta}"`);
}
*/

// Rota para atualizar uma proposta (adicionar resposta)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { resposta } = req.body;

  if (!resposta) {
    res.status(400).json({ erro: "Informe a resposta desta proposta" });
    return;
  }

  try {
    // Primeiro, busca a proposta para obter os dados do cliente e gado antes de atualizar
    const dadosPropostaOriginal = await prisma.proposta.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: {
          select: {
            // Seleciona apenas os campos necessários do cliente
            id: true,
            nome: true,
            cpf: true,
            telefone: true, // Garante que o telefone do cliente é carregado
          },
        },
        gado: true,
      },
    });

    if (!dadosPropostaOriginal) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    // Agora, atualiza a proposta com a resposta
    const propostaAtualizada = await prisma.proposta.update({
      where: { id: Number(id) },
      data: { resposta },
    });

    // Se você tivesse uma função de envio de WhatsApp, chamaria ela aqui:
    /*
    if (dadosPropostaOriginal.cliente?.telefone) {
        enviaMensagemWhatsApp(
            dadosPropostaOriginal.cliente.nome,
            dadosPropostaOriginal.cliente.telefone, // Usa o telefone
            dadosPropostaOriginal.descricao,
            resposta
        );
    }
    */
    console.log(`Proposta ${id} atualizada. Resposta: "${resposta}".`);
    console.log(
      `Dados do cliente para comunicação (se aplicável): Nome: ${dadosPropostaOriginal.cliente?.nome}, Telefone: ${dadosPropostaOriginal.cliente?.telefone}`
    );

    res.status(200).json(propostaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar proposta ou enviar notificação:", error);
    res.status(400).json(error);
  }
});

// Rota para listar propostas de um cliente específico
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
