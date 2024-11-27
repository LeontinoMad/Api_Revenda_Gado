import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const gados = await prisma.gado.findMany({
      include: {
        racas: true,
      },
    });
    res.status(200).json(gados);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", async (req, res) => {
  const {
    tipo,
    idade,
    preco,
    peso,
    informacoes,
    //destaque,
    foto,
    sexo,
    racasId,
  } = req.body;

  if (
    !tipo ||
    !idade ||
    !preco ||
    !peso ||
    !informacoes ||
    // !destaque ||
    !foto ||
    !sexo ||
    !racasId
  ) {
    res.status(400).json({
      erro: "Informe tipo, idade, preco, peso, informaçoes, destaque, foto, sexo, racasId",
    });
    return;
  }

  try {
    const gado = await prisma.gado.create({
      data: { tipo, idade, preco, peso, informacoes, foto, racasId },
    });
    res.status(201).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const gado = await prisma.gado.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { sexo, racasId, foto } = req.body;

  if (!sexo || !racasId) {
    res.status(400).json({
      erro: "Informe sexo ou racasId",
    });
    return;
  }

  try {
    const gado = await prisma.gado.update({
      where: { id: Number(id) },
      data: { sexo, racasId, foto },
    });
    res.status(200).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;
  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    try {
      const gados = await prisma.gado.findMany({
        include: {
          racas: true,
        },
        where: {
          OR: [
            { tipo: { contains: termo.toLowerCase() } }, // Converte o termo para minúsculas
            { racas: { nome: { contains: termo.toLowerCase() } } }, // Converte o nome da raça para minúsculas
          ],
        },
      });
      res.status(200).json(gados);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    try {
      const gados = await prisma.gado.findMany({
        include: {
          racas: true,
        },
        where: {
          preco: { lte: termoNumero },
        },
      });
      res.status(200).json(gados);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const gado = await prisma.gado.findUnique({
      where: { id: Number(id) },
      include: {
        racas: true,
      },
    });
    res.status(200).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
