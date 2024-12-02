import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

// Rota GET: Retorna todos os gados
router.get("/", async (req, res) => {
  try {
    const gados = await prisma.gado.findMany({
      include: {
        racas: true,
      },
    });

    // Adiciona valor padrão para 'foto' caso esteja ausente
    const gadosComFotoPadrao = gados.map((gado) => ({
      ...gado,
      foto: gado.foto || "/default-image.jpg",
    }));

    res.status(200).json(gadosComFotoPadrao);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota POST: Cria um novo gado
router.post("/", async (req, res) => {
  const {
    tipo,
    idade,
    preco,
    peso,
    informacoes,
    foto = "/default-image.jpg", // Valor padrão
    sexo,
    racasId,
  } = req.body;

  if (!tipo || !idade || !preco || !peso || !informacoes || !sexo || !racasId) {
    res.status(400).json({
      erro: "Informe tipo, idade, preco, peso, informações, sexo e racasId",
    });
    return;
  }

  try {
    const gado = await prisma.gado.create({
      data: { tipo, idade, preco, peso, informacoes, foto, sexo, racasId },
    });
    res.status(201).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota DELETE: Remove um gado pelo ID
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

// Rota PUT: Atualiza informações de um gado pelo ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { sexo, racasId, foto = "/default-image.jpg" } = req.body; // Valor padrão

  if (!sexo || !racasId) {
    res.status(400).json({
      erro: "Informe sexo e racasId",
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

// Rota GET: Pesquisa gados por termo
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
            { tipo: { contains: termo.toLowerCase() } }, // Busca por tipo
            { racas: { nome: { contains: termo.toLowerCase() } } }, // Busca por raça
          ],
        },
      });

      // Adiciona valor padrão para 'foto'
      const gadosComFotoPadrao = gados.map((gado) => ({
        ...gado,
        foto: gado.foto || "/default-image.jpg",
      }));

      res.status(200).json(gadosComFotoPadrao);
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

      // Adiciona valor padrão para 'foto'
      const gadosComFotoPadrao = gados.map((gado) => ({
        ...gado,
        foto: gado.foto || "/default-image.jpg",
      }));

      res.status(200).json(gadosComFotoPadrao);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});

// Rota GET: Busca um gado pelo ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const gado = await prisma.gado.findUnique({
      where: { id: Number(id) },
      include: {
        racas: true,
      },
    });

    if (!gado) {
      res.status(404).json({ erro: "Gado não encontrado" });
      return;
    }

    // Adiciona valor padrão para 'foto'
    gado.foto = gado.foto || "/default-image.jpg";

    res.status(200).json(gado);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
