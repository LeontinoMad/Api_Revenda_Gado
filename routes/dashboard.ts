import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count();
    const gados = await prisma.gado.count();
    const propostas = await prisma.proposta.count();
    res.status(200).json({ clientes, gados, propostas });
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/gadosRaca", async (req, res) => {
  try {
    const gados = await prisma.gado.groupBy({
      by: ["racasId"],
      _count: {
        id: true,
      },
    });

    // Para cada gado, inclui o nome da raca relacionada ao racaId
    const gadosRaca = await Promise.all(
      gados.map(async (gado) => {
        const raca = await prisma.raca.findUnique({
          where: { id: gado.racasId },
        });
        return {
          raca: raca?.nome,
          num: gado._count.id,
        };
      })
    );
    res.status(200).json(gadosRaca);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
